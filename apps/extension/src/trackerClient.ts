import * as vscode from "vscode";

import { AzureDevOpsTokenOptions } from "./azureDevOpsAuth";
import { logInfo, logWarn } from "./logger";
import { CopilotChatRequest, TrackerEvent } from "./types";

const extensionId = "copilot-tracker";
const defaultServerUrl = "http://localhost:3737";
const trustedServerOriginsKey = "trustedServerOrigins";
const requestTimeoutMs = 15_000;
const maxRequestAttempts = 3;

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
    private readonly getToken: (
      options?: AzureDevOpsTokenOptions,
    ) => Promise<string | null>,
    private readonly trustedServerOrigins: vscode.Memento,
  ) {}

  public async signInAndTrustServer(): Promise<boolean> {
    const serverUrl = parseTrackerServerUrl(getTrackerConfig().serverUrl);
    const token = await this.getToken({ interactive: true });
    if (!token) {
      return false;
    }

    await this.ensureTrustedServerOrigin(serverUrl, true);
    return true;
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
      { interactive: true, workItemAccess: true },
    );
    return payload.workItems ?? [];
  }

  private async get<T>(
    path: string,
    tokenOptions: AzureDevOpsTokenOptions = {},
  ): Promise<T> {
    const response = await this.request(
      path,
      { method: "GET" },
      tokenOptions,
    );
    return response as T;
  }

  private async post(path: string, body: unknown): Promise<void> {
    await this.request(
      path,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      { interactive: false },
    );
  }

  private async request(
    path: string,
    init: { method: "GET" | "POST"; body?: string },
    tokenOptions: AzureDevOpsTokenOptions,
  ): Promise<unknown> {
    const config = getTrackerConfig();
    const serverUrl = parseTrackerServerUrl(config.serverUrl);
    const token = await this.getToken(tokenOptions);
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
      await this.ensureTrustedServerOrigin(
        serverUrl,
        tokenOptions.interactive === true,
      );
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
      `Allow Copilot Tracker to send your Azure DevOps token to ${serverUrl.origin}?`,
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
    return responseBody.slice(0, 240);
  }

  if (
    typeof responseBody === "object" &&
    "error" in responseBody &&
    typeof responseBody.error === "string"
  ) {
    return responseBody.error;
  }

  return null;
}
