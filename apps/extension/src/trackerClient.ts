import * as vscode from "vscode";

import { logInfo, logWarn } from "./logger";
import { CopilotChatRequest, TrackerEvent } from "./types";

const extensionId = "copilot-tracker";
const defaultServerUrl = "http://localhost:3737";
const trustedServerOriginsKey = "trustedServerOrigins";
const trackerAuthTokenSecretKey = "trackerAuthToken";
const trackerAuthStateSecretKey = "trackerAuthState";
const requestTimeoutMs = 15_000;
const maxRequestAttempts = 3;
const maxAzureDevOpsWorkItemId = 2_147_483_647;

export interface TrackerConfig {
  serverUrl: string;
  otelFilePath: string;
  syncIntervalSeconds: number;
  showCurrentSessionTokensInStatusBar: boolean;
}

export interface AzureDevOpsWorkItem {
  id: number;
  title: string;
  state: string | null;
  type: string | null;
  project: string | null;
  assignedTo: string | null;
  changedAt: string | null;
  url: string | null;
}

export interface TrackerSecretStorage {
  get(key: string): Thenable<string | undefined>;
  store(key: string, value: string): Thenable<void>;
  delete(key: string): Thenable<void>;
}

export function getTrackerConfig(): TrackerConfig {
  const config = vscode.workspace.getConfiguration(extensionId);
  const serverUrl =
    config.inspect<string>("serverUrl")?.globalValue ?? defaultServerUrl;
  return {
    serverUrl,
    otelFilePath: config.get<string>("otelFilePath", ""),
    syncIntervalSeconds: Math.max(
      5,
      config.get<number>("syncIntervalSeconds", 15),
    ),
    showCurrentSessionTokensInStatusBar: config.get<boolean>(
      "showCurrentSessionTokensInStatusBar",
      true,
    ),
  };
}

export class TrackerClientError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "TrackerClientError";
  }
}

export class TrackerClient {
  public constructor(
    private readonly secretStorage: TrackerSecretStorage,
    private readonly trustedServerOrigins: vscode.Memento,
  ) {}

  public async signInAndTrustServer(callbackUri: vscode.Uri): Promise<boolean> {
    const serverUrl = parseTrackerServerUrl(getTrackerConfig().serverUrl);
    await this.ensureTrustedServerOrigin(serverUrl, true);
    const state = crypto.randomUUID();
    await this.secretStorage.store(trackerAuthStateSecretKey, state);

    const signInUrl = extensionSignInUrl(serverUrl, callbackUri, state);
    logInfo("Opening Copilot Tracker browser sign-in", {
      serverOrigin: serverUrl.origin,
      callbackScheme: callbackUri.scheme,
    });
    return vscode.env.openExternal(vscode.Uri.parse(signInUrl.toString()));
  }

  public async completeSignIn(uri: vscode.Uri): Promise<void> {
    const params = new URLSearchParams(uri.query);
    const token = params.get("token");
    const state = params.get("state");
    const expectedState = await this.secretStorage.get(trackerAuthStateSecretKey);
    await this.secretStorage.delete(trackerAuthStateSecretKey);

    if (!token || !state || !expectedState || state !== expectedState) {
      throw new TrackerClientError(
        "invalid_auth_callback",
        "Copilot Tracker sign-in callback was invalid. Please try signing in again.",
      );
    }

    await this.secretStorage.store(trackerAuthTokenSecretKey, token);
    logInfo("Copilot Tracker browser sign-in completed");
  }

  public async sendEvent(event: TrackerEvent): Promise<void> {
    await this.post("/api/events", event);
  }

  public async sendChatRequests(requests: CopilotChatRequest[]): Promise<void> {
    if (requests.length === 0) {
      logInfo("Skipping chat request POST because there are no requests");
      return;
    }

    await this.post("/api/chat-requests/batch", { requests });
  }

  public async searchWorkItems(
    query: string,
  ): Promise<AzureDevOpsWorkItem[]> {
    const params = new URLSearchParams({ query });
    const payload = await this.get<{ workItems?: AzureDevOpsWorkItem[] }>(
      `/api/azure-devops/work-items?${params.toString()}`,
    );
    return normalizeWorkItems(payload);
  }

  private async get<T>(path: string): Promise<T> {
    const response = await this.request(path, { method: "GET" });
    return response as T;
  }

  private async post(path: string, body: unknown): Promise<void> {
    await this.request(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  private async request(
    path: string,
    init: { method: "GET" | "POST"; body?: string },
  ): Promise<unknown> {
    const config = getTrackerConfig();
    const serverUrl = parseTrackerServerUrl(config.serverUrl);
    const token = await this.secretStorage.get(trackerAuthTokenSecretKey);
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (!token && !isLocalServerUrl(serverUrl)) {
      throw new TrackerClientError(
        "not_authenticated",
        "Sign in to Copilot Tracker before syncing to this server.",
      );
    }
    if (token) {
      await this.ensureTrustedServerOrigin(serverUrl, false);
      headers.authorization = `Bearer ${token}`;
    }

    const url = new URL(path, serverUrl);
    logInfo("Calling Copilot Tracker server", {
      path,
      method: init.method,
      serverOrigin: serverUrl.origin,
      hasToken: Boolean(token),
    });

    const response = await fetchWithRetry(url, {
      method: init.method,
      headers,
      body: init.body,
    });
    const responseBody = await readResponseBody(response);
    logInfo("Copilot Tracker server responded", {
      path,
      method: init.method,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      logWarn("Copilot Tracker server returned an error", {
        path,
        method: init.method,
        status: response.status,
        error: responseBodyToMessage(responseBody),
      });
      throw new TrackerClientError(
        `http_${response.status}`,
        responseBodyToMessage(responseBody) ??
          `Copilot Tracker server returned HTTP ${response.status}`,
        response.status,
      );
    }

    return responseBody;
  }

  private async ensureTrustedServerOrigin(
    serverUrl: URL,
    interactive: boolean,
  ) {
    if (isLocalServerUrl(serverUrl) || this.isTrustedServerOrigin(serverUrl)) {
      return;
    }

    if (!interactive) {
      throw new TrackerClientError(
        "untrusted_server",
        `Copilot Tracker server ${serverUrl.origin} is not trusted yet.`,
      );
    }

    const choice = await vscode.window.showWarningMessage(
      `Allow Copilot Tracker to authenticate with ${serverUrl.origin}?`,
      { modal: true },
      "Allow",
    );
    if (choice !== "Allow") {
      throw new TrackerClientError(
        "untrusted_server",
        `Copilot Tracker server ${serverUrl.origin} was not trusted.`,
      );
    }

    await this.trustedServerOrigins.update(trustedServerOriginsKey, [
      ...this.readTrustedServerOrigins(),
      serverUrl.origin,
    ]);
  }

  private isTrustedServerOrigin(serverUrl: URL) {
    return this.readTrustedServerOrigins().includes(serverUrl.origin);
  }

  private readTrustedServerOrigins() {
    return [
      ...new Set(
        this.trustedServerOrigins
          .get<string[]>(trustedServerOriginsKey, [])
          .filter((value) => typeof value === "string"),
      ),
    ];
  }
}

export function extensionSignInUrl(
  serverUrl: URL,
  callbackUri: vscode.Uri,
  state: string,
) {
  const url = new URL("/api/auth/extension-token", serverUrl);
  url.searchParams.set("callback", callbackUri.toString());
  url.searchParams.set("state", state);
  return url;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function parseTrackerServerUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TrackerClientError(
      "invalid_server_url",
      "Copilot Tracker server URL is invalid.",
    );
  }

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new TrackerClientError(
      "invalid_server_url",
      "Copilot Tracker server URL must be an origin without path, credentials, query, or fragment values.",
    );
  }

  if (url.protocol !== "https:" && !isLocalServerUrl(url)) {
    throw new TrackerClientError(
      "invalid_server_url",
      "Copilot Tracker server URL must use HTTPS unless it points to localhost.",
    );
  }

  return url;
}

function isLocalServerUrl(url: URL) {
  return (
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  );
}

async function fetchWithRetry(
  url: URL,
  init: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRequestAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init);
      if (!isRetryableStatus(response.status) || attempt === maxRequestAttempts) {
        return response;
      }
      await delay(retryDelayMs(response, attempt));
    } catch (error) {
      lastError = error;
      if (attempt === maxRequestAttempts) {
        break;
      }
      await delay(300 * attempt);
    }
  }

  throw new TrackerClientError(
    "network_error",
    lastError instanceof Error
      ? lastError.message
      : "Could not reach Copilot Tracker server.",
  );
}

async function fetchWithTimeout(
  url: URL,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function retryDelayMs(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds * 1000;
  }

  return 300 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function responseBodyToMessage(responseBody: unknown) {
  if (!responseBody) {
    return null;
  }

  if (typeof responseBody === "string") {
    return trimServerMessage(responseBody);
  }

  if (
    typeof responseBody === "object" &&
    !Array.isArray(responseBody) &&
    "error" in responseBody &&
    typeof responseBody.error === "string" &&
    responseBody.error.trim()
  ) {
    return trimServerMessage(responseBody.error);
  }

  return null;
}

function trimServerMessage(value: string) {
  return value.trim().slice(0, 240) || null;
}

function normalizeWorkItems(payload: unknown): AzureDevOpsWorkItem[] {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    !("workItems" in payload) ||
    !Array.isArray(payload.workItems)
  ) {
    return [];
  }

  return payload.workItems.filter(isAzureDevOpsWorkItem);
}

function isAzureDevOpsWorkItem(value: unknown): value is AzureDevOpsWorkItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "number" &&
    Number.isSafeInteger(item.id) &&
    item.id > 0 &&
    item.id <= maxAzureDevOpsWorkItemId &&
    typeof item.title === "string" &&
    isNullableString(item.state) &&
    isNullableString(item.type) &&
    isNullableString(item.project) &&
    isNullableString(item.assignedTo) &&
    isNullableString(item.changedAt) &&
    isNullableString(item.url)
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
