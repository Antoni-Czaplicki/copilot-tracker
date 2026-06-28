import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";
import * as vscode from "vscode";

import { logDebug, logInfo, logWarn } from "./logger";
import { TrackerConfig } from "./trackerClient";
import {
  CopilotChatRequest,
  PromptTokenDetail,
  WorkspaceContext,
} from "./types";

const execFileAsync = promisify(execFile);

interface WorkspaceStorageMatch {
  storagePath: string;
  chatSessionsPath: string;
  stateDbPath: string;
}

interface SessionIndexEntry {
  sessionId: string;
  title: string | null;
  lastMessageDate: number | string | null;
}

interface ModelMetadata {
  id?: string;
  name?: string;
  vendor?: string;
  family?: string;
  version?: string;
}

interface ParsedRequest {
  requestId: string | null;
  responseId: string | null;
  sessionId: string;
  sessionCreatedAt: string | null;
  sessionTitle: string | null;
  requestStartedAt: string | null;
  requestCompletedAt: string | null;
  modelId: string | null;
  resolvedModel: string | null;
  modelName: string | null;
  modelVendor: string | null;
  modelFamily: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  promptTokenDetails: PromptTokenDetail[];
  toolCallRoundCount: number;
  stopReasons: string[];
}

interface RequestTaskResolution {
  selectedTask?: string | null;
  defaultTask?: string | null;
  branch?: string | null;
}

export type RequestTaskResolver = (
  request: Pick<
    ParsedRequest,
    | "requestId"
    | "responseId"
    | "sessionId"
    | "requestStartedAt"
    | "requestCompletedAt"
  >,
) => RequestTaskResolution | null | undefined;

export function getDefaultWorkspaceStorageRoot(): string {
  switch (process.platform) {
    case "darwin":
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "Code",
        "User",
        "workspaceStorage",
      );
    case "win32":
      return path.join(
        process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"),
        "Code",
        "User",
        "workspaceStorage",
      );
    default:
      return path.join(
        process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"),
        "Code",
        "User",
        "workspaceStorage",
      );
  }
}

export async function getChatSessionSignature(
  storageRoot: string,
): Promise<string> {
  const hash = createHash("sha256");
  const files = await findChatSessionFiles(storageRoot);
  for (const file of files) {
    try {
      const fileStat = await stat(file);
      hash.update(file);
      hash.update(String(fileStat.mtimeMs));
      hash.update(String(fileStat.size));
    } catch {
      // Ignore files removed while scanning.
    }
  }

  const signature = hash.digest("hex");
  logDebug("Computed chat storage signature", {
    storageRoot,
    fileCount: files.length,
  });
  return signature;
}

export async function readCopilotChatRequests(
  workspaceContext: WorkspaceContext,
  config: TrackerConfig,
  resolveTaskForRequest?: RequestTaskResolver,
): Promise<CopilotChatRequest[]> {
  const storageRoot =
    config.chatStoragePath || getDefaultWorkspaceStorageRoot();
  logInfo("Reading Copilot chat requests", {
    storageRoot,
    workspacePath: workspaceContext.workspacePath,
    repositoryRoot: workspaceContext.repositoryRoot,
  });
  const storage = await findWorkspaceStorage(storageRoot, workspaceContext);
  if (!storage) {
    logWarn("No matching VS Code workspace storage directory found", {
      storageRoot,
      workspacePath: workspaceContext.workspacePath,
      repositoryRoot: workspaceContext.repositoryRoot,
    });
    return [];
  }

  const index = await readSessionIndex(storage.stateDbPath);
  const files = await findChatSessionFiles(storage.chatSessionsPath);
  logInfo("Matched VS Code workspace storage", {
    storagePath: storage.storagePath,
    chatSessionsPath: storage.chatSessionsPath,
    stateDbPath: storage.stateDbPath,
    indexedSessionCount: index.size,
    chatFileCount: files.length,
  });
  const requests: CopilotChatRequest[] = [];

  for (const file of files) {
    const sessionId = path.basename(file).replace(/\.(jsonl|json)$/i, "");
    const sessionIndexEntry = index.get(sessionId);
    const parsedRequests = await parseChatSessionFile(
      file,
      sessionId,
      sessionIndexEntry?.title ?? null,
    );
    logDebug("Parsed chat session file", {
      file,
      sessionId,
      requestCount: parsedRequests.length,
    });
    for (const request of parsedRequests) {
      const requestWorkspaceContext = {
        ...workspaceContext,
        ...(resolveTaskForRequest?.(request) ?? {}),
      };
      const inputTokens = request.inputTokens;
      const outputTokens = request.outputTokens;
      const totalTokens =
        inputTokens === null && outputTokens === null
          ? null
          : (inputTokens ?? 0) + (outputTokens ?? 0);
      const tokenSource =
        inputTokens === null && outputTokens === null
          ? "missing-in-vscode-chat-session"
          : "vscode-chat-session";

      requests.push({
        ...requestWorkspaceContext,
        requestRecordId: createRequestRecordId(
          requestWorkspaceContext,
          request,
        ),
        requestId: request.requestId,
        responseId: request.responseId,
        sessionId: request.sessionId,
        sessionTitle: request.sessionTitle,
        sessionCreatedAt: request.sessionCreatedAt,
        requestStartedAt: request.requestStartedAt,
        requestCompletedAt: request.requestCompletedAt,
        modelId: request.modelId,
        resolvedModel: request.resolvedModel,
        modelName: request.modelName,
        modelVendor: request.modelVendor,
        modelFamily: request.modelFamily,
        inputTokens,
        outputTokens,
        totalTokens,
        tokenSource,
        promptTokenDetails: request.promptTokenDetails,
        toolCallRoundCount: request.toolCallRoundCount,
        stopReasons: request.stopReasons,
        capturedAt: new Date().toISOString(),
      });
    }
  }

  const dedupedRequests = dedupeChatRequests(requests);
  const duplicateCount = requests.length - dedupedRequests.length;
  if (duplicateCount > 0) {
    logInfo("Collapsed duplicate Copilot chat request records", {
      duplicateCount,
      requestCountBefore: requests.length,
      requestCountAfter: dedupedRequests.length,
    });
  }

  logInfo("Finished reading Copilot chat requests", {
    requestCount: dedupedRequests.length,
    tokenCount: dedupedRequests.reduce(
      (total, request) => total + (request.totalTokens ?? 0),
      0,
    ),
    missingTokenCount: dedupedRequests.filter(
      (request) => request.totalTokens === null,
    ).length,
  });
  return dedupedRequests.sort(compareRequestsChronologically);
}

function dedupeChatRequests(
  requests: CopilotChatRequest[],
): CopilotChatRequest[] {
  const byRecordId = new Map<string, CopilotChatRequest>();
  for (const request of requests) {
    const previous = byRecordId.get(request.requestRecordId);
    byRecordId.set(
      request.requestRecordId,
      previous ? chooseRicherRequest(previous, request) : request,
    );
  }

  return [...byRecordId.values()];
}

function chooseRicherRequest(
  current: CopilotChatRequest,
  next: CopilotChatRequest,
): CopilotChatRequest {
  if (requestCompletenessScore(next) > requestCompletenessScore(current)) {
    return mergeRequests(next, current);
  }

  return mergeRequests(current, next);
}

function mergeRequests(
  preferred: CopilotChatRequest,
  fallback: CopilotChatRequest,
): CopilotChatRequest {
  return {
    ...preferred,
    requestId: preferred.requestId ?? fallback.requestId,
    responseId: preferred.responseId ?? fallback.responseId,
    sessionTitle: preferred.sessionTitle ?? fallback.sessionTitle,
    sessionCreatedAt: preferred.sessionCreatedAt ?? fallback.sessionCreatedAt,
    requestStartedAt: preferred.requestStartedAt ?? fallback.requestStartedAt,
    requestCompletedAt:
      preferred.requestCompletedAt ?? fallback.requestCompletedAt,
    modelId: preferred.modelId ?? fallback.modelId,
    resolvedModel: preferred.resolvedModel ?? fallback.resolvedModel,
    modelName: preferred.modelName ?? fallback.modelName,
    modelVendor: preferred.modelVendor ?? fallback.modelVendor,
    modelFamily: preferred.modelFamily ?? fallback.modelFamily,
    inputTokens: preferred.inputTokens ?? fallback.inputTokens,
    outputTokens: preferred.outputTokens ?? fallback.outputTokens,
    totalTokens: preferred.totalTokens ?? fallback.totalTokens,
    promptTokenDetails:
      preferred.promptTokenDetails.length > 0
        ? preferred.promptTokenDetails
        : fallback.promptTokenDetails,
    stopReasons:
      preferred.stopReasons.length > 0
        ? preferred.stopReasons
        : fallback.stopReasons,
  };
}

function requestCompletenessScore(request: CopilotChatRequest) {
  return [
    request.totalTokens === null ? 0 : 100,
    request.inputTokens === null ? 0 : 20,
    request.outputTokens === null ? 0 : 20,
    request.requestCompletedAt ? 10 : 0,
    request.modelId ? 5 : 0,
    request.promptTokenDetails.length,
    Date.parse(
      request.requestCompletedAt ??
        request.requestStartedAt ??
        request.capturedAt,
    ) / 1_000_000_000_000,
  ].reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export function createChatSessionWatcher(
  storageRoot: string,
  onChanged: () => void,
): vscode.Disposable[] {
  const rootUri = vscode.Uri.file(storageRoot);
  const [jsonlPattern, jsonPattern] =
    getChatSessionWatcherPatterns(storageRoot);
  const jsonlWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(rootUri, jsonlPattern),
  );
  const jsonWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(rootUri, jsonPattern),
  );

  return [
    jsonlWatcher,
    jsonWatcher,
    jsonlWatcher.onDidCreate(onChanged),
    jsonlWatcher.onDidChange(onChanged),
    jsonlWatcher.onDidDelete(onChanged),
    jsonWatcher.onDidCreate(onChanged),
    jsonWatcher.onDidChange(onChanged),
    jsonWatcher.onDidDelete(onChanged),
  ];
}

export function getChatSessionWatcherPatterns(
  storageRoot: string,
): [string, string] {
  if (path.basename(storageRoot) === "chatSessions") {
    return ["*.jsonl", "*.json"];
  }

  return ["**/chatSessions/*.jsonl", "**/chatSessions/*.json"];
}

async function findWorkspaceStorage(
  storageRoot: string,
  workspaceContext: WorkspaceContext,
): Promise<WorkspaceStorageMatch | null> {
  if (!existsSync(storageRoot)) {
    logWarn("Configured VS Code storage root does not exist", { storageRoot });
    return null;
  }

  const directMatch = await getDirectStorageMatch(storageRoot);
  if (directMatch) {
    logInfo("Using direct VS Code workspace storage match", directMatch);
    return directMatch;
  }

  const candidates = await readdir(storageRoot, { withFileTypes: true });
  const needles = [
    workspaceContext.workspacePath,
    workspaceContext.repositoryRoot,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (!candidate.isDirectory()) {
      continue;
    }

    const storagePath = path.join(storageRoot, candidate.name);
    const workspaceJsonPath = path.join(storagePath, "workspace.json");
    try {
      const workspaceJson = await readFile(workspaceJsonPath, "utf8");
      if (
        needles.some(
          (needle) =>
            workspaceJson.includes(needle) ||
            workspaceJson.includes(encodeURI(needle)),
        )
      ) {
        logInfo("Found VS Code workspace storage candidate", {
          storagePath,
          workspaceJsonPath,
        });
        return {
          storagePath,
          chatSessionsPath: path.join(storagePath, "chatSessions"),
          stateDbPath: path.join(storagePath, "state.vscdb"),
        };
      }
    } catch {
      // Not a workspace storage directory.
    }
  }

  logWarn("Scanned VS Code storage root without finding workspace match", {
    storageRoot,
    candidateCount: candidates.length,
    needles,
  });
  return null;
}

async function getDirectStorageMatch(
  storageRoot: string,
): Promise<WorkspaceStorageMatch | null> {
  const storageRootName = path.basename(storageRoot);
  if (storageRootName === "chatSessions") {
    const storagePath = path.dirname(storageRoot);
    return {
      storagePath,
      chatSessionsPath: storageRoot,
      stateDbPath: path.join(storagePath, "state.vscdb"),
    };
  }

  const chatSessionsPath = path.join(storageRoot, "chatSessions");
  if (existsSync(chatSessionsPath)) {
    return {
      storagePath: storageRoot,
      chatSessionsPath,
      stateDbPath: path.join(storageRoot, "state.vscdb"),
    };
  }

  return null;
}

async function findChatSessionFiles(root: string): Promise<string[]> {
  if (!existsSync(root)) {
    return [];
  }

  const files: string[] = [];
  await walk(root, files);
  return files.filter((file) => /\.(jsonl|json)$/i.test(file)).sort();
}

async function walk(directory: string, files: string[]): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(entryPath, files);
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
}

async function readSessionIndex(
  stateDbPath: string,
): Promise<Map<string, SessionIndexEntry>> {
  const entries = new Map<string, SessionIndexEntry>();
  if (!existsSync(stateDbPath)) {
    return entries;
  }

  try {
    const { stdout } = await execFileAsync("sqlite3", [
      "-readonly",
      stateDbPath,
      "SELECT value FROM ItemTable WHERE key = 'chat.ChatSessionStore.index';",
    ]);
    const parsed = JSON.parse(stdout.trim()) as {
      entries?: Record<
        string,
        {
          sessionId?: string;
          title?: string;
          lastMessageDate?: number | string;
        }
      >;
    };
    for (const [sessionId, entry] of Object.entries(parsed.entries ?? {})) {
      entries.set(sessionId, {
        sessionId: entry.sessionId ?? sessionId,
        title: typeof entry.title === "string" ? entry.title : null,
        lastMessageDate: entry.lastMessageDate ?? null,
      });
    }
  } catch (error) {
    console.warn(
      "Copilot Tracker could not read VS Code chat session index",
      error,
    );
    logWarn("Could not read VS Code chat session index", {
      stateDbPath,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return entries;
}

async function parseChatSessionFile(
  file: string,
  sessionIdFromFile: string,
  sessionTitle: string | null,
): Promise<ParsedRequest[]> {
  const text = await readFile(file, "utf8");
  const records = file.endsWith(".jsonl")
    ? text
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => safeJsonParse(line))
        .filter(Boolean)
    : [safeJsonParse(text)].filter(Boolean);

  let sessionId = sessionIdFromFile;
  let sessionCreatedAt: string | null = null;
  let selectedModel: ModelMetadata = {};
  const requests: ParsedRequest[] = [];
  let ignoredRecordCount = 0;

  for (const record of records) {
    const kind = readNumber(record, ["kind"]);
    const value = readUnknown(record, ["v"]);

    if (kind === 0 && isRecord(value)) {
      sessionId = readString(value, ["sessionId"]) ?? sessionId;
      sessionCreatedAt =
        toIsoDate(readUnknown(value, ["creationDate"])) ?? sessionCreatedAt;
      selectedModel =
        readModelMetadata(
          readUnknown(value, ["inputState", "selectedModel", "metadata"]),
        ) ?? selectedModel;
      ignoredRecordCount += pushRequestRecords(
        readUnknown(value, ["requests"]),
        requests,
        sessionId,
        sessionCreatedAt,
        sessionTitle,
        selectedModel,
      );
    }

    if (kind === 1 && isRecord(value)) {
      selectedModel =
        readModelMetadata(readUnknown(value, ["metadata"])) ?? selectedModel;
    }

    if (kind === 2) {
      ignoredRecordCount += pushRequestRecords(
        value,
        requests,
        sessionId,
        sessionCreatedAt,
        sessionTitle,
        selectedModel,
      );
    }
  }

  if (ignoredRecordCount > 0) {
    logDebug("Ignored non-request chat storage records", {
      file,
      sessionId,
      ignoredRecordCount,
      requestCount: requests.length,
    });
  }

  return requests;
}

function pushRequestRecords(
  value: unknown,
  requests: ParsedRequest[],
  sessionId: string,
  sessionCreatedAt: string | null,
  sessionTitle: string | null,
  selectedModel: ModelMetadata,
) {
  if (value === undefined || value === null) {
    return 0;
  }

  const records = Array.isArray(value) ? value : [value];
  let ignoredRecordCount = 0;

  for (const request of records) {
    if (!isChatRequestRecord(request)) {
      ignoredRecordCount += 1;
      continue;
    }
    requests.push(
      parseRequestRecord(
        request,
        sessionId,
        sessionCreatedAt,
        sessionTitle,
        selectedModel,
      ),
    );
  }

  return ignoredRecordCount;
}

function isChatRequestRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  const hasIdentity =
    Boolean(readString(value, ["requestId"])) ||
    Boolean(readString(value, ["responseId"])) ||
    Boolean(readString(value, ["result", "metadata", "responseId"])) ||
    readUnknown(value, ["timestamp"]) !== undefined;
  const hasTokenShape =
    readNumber(value, ["promptTokens"]) !== null ||
    readNumber(value, ["completionTokens"]) !== null ||
    readNumber(value, ["result", "metadata", "promptTokens"]) !== null ||
    readNumber(value, ["result", "metadata", "outputTokens"]) !== null ||
    Array.isArray(readUnknown(value, ["promptTokenDetails"]));
  const hasRequestShape =
    Boolean(readString(value, ["modelId"])) ||
    isRecord(readUnknown(value, ["message"])) ||
    Array.isArray(readUnknown(value, ["response"])) ||
    hasTokenShape;

  return hasIdentity && hasRequestShape;
}

function parseRequestRecord(
  request: Record<string, unknown>,
  sessionId: string,
  sessionCreatedAt: string | null,
  sessionTitle: string | null,
  selectedModel: ModelMetadata,
): ParsedRequest {
  const metadata = readUnknown(request, ["result", "metadata"]);
  const metadataRecord = isRecord(metadata) ? metadata : {};
  const response = readUnknown(request, ["response"]);
  const inputTokens =
    readNumber(metadataRecord, ["promptTokens"]) ??
    readNumber(request, ["promptTokens"]);
  const outputTokens =
    readNumber(metadataRecord, ["outputTokens"]) ??
    readNumber(request, ["completionTokens"]);
  const modelMetadata = selectedModel;

  return {
    requestId: readString(request, ["requestId"]),
    responseId:
      readString(request, ["responseId"]) ??
      readString(metadataRecord, ["responseId"]),
    sessionId: readString(metadataRecord, ["sessionId"]) ?? sessionId,
    sessionCreatedAt,
    sessionTitle: sessionTitle ?? extractGeneratedTitle(response),
    requestStartedAt: toIsoDate(readUnknown(request, ["timestamp"])),
    requestCompletedAt: toIsoDate(
      readUnknown(request, ["modelState", "completedAt"]),
    ),
    modelId: readString(request, ["modelId"]),
    resolvedModel: readString(metadataRecord, ["resolvedModel"]),
    modelName: modelMetadata.name ?? null,
    modelVendor: modelMetadata.vendor ?? null,
    modelFamily: modelMetadata.family ?? null,
    inputTokens,
    outputTokens,
    promptTokenDetails: readPromptTokenDetails(
      readUnknown(request, ["promptTokenDetails"]),
    ),
    toolCallRoundCount: Array.isArray(
      readUnknown(metadataRecord, ["toolCallRounds"]),
    )
      ? (readUnknown(metadataRecord, ["toolCallRounds"]) as unknown[]).length
      : 0,
    stopReasons: readStopReasons(response),
  };
}

function readPromptTokenDetails(value: unknown): PromptTokenDetail[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((detail) => ({
    category: readString(detail, ["category"]),
    label: readString(detail, ["label"]),
    percentageOfPrompt: readNumber(detail, ["percentageOfPrompt"]),
  }));
}

function readStopReasons(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((entry) => readString(entry, ["metadata", "stopReason"]))
    .filter((entry): entry is string => Boolean(entry));
}

function extractGeneratedTitle(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }
    const title = readString(entry, ["generatedTitle"]);
    if (title) {
      return title;
    }
  }

  return null;
}

function readModelMetadata(value: unknown): ModelMetadata | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: readString(value, ["id"]) ?? undefined,
    name: readString(value, ["name"]) ?? undefined,
    vendor: readString(value, ["vendor"]) ?? undefined,
    family: readString(value, ["family"]) ?? undefined,
    version: readString(value, ["version"]) ?? undefined,
  };
}

function createRequestRecordId(
  workspaceContext: WorkspaceContext,
  request: ParsedRequest,
): string {
  if (request.requestId) {
    return request.requestId;
  }

  if (request.responseId) {
    return `response:${request.responseId}`;
  }

  return createHash("sha256")
    .update(
      [
        workspaceContext.workspaceId,
        request.sessionId,
        request.requestStartedAt ?? "",
        request.modelId ?? "",
      ].join("|"),
    )
    .digest("hex");
}

function compareRequestsChronologically(
  a: CopilotChatRequest,
  b: CopilotChatRequest,
) {
  return requestTimestamp(a) - requestTimestamp(b);
}

function requestTimestamp(request: CopilotChatRequest) {
  const timestamp = Date.parse(
    request.requestStartedAt ??
      request.requestCompletedAt ??
      request.capturedAt,
  );
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function safeJsonParse(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function readUnknown(source: unknown, pathParts: string[]): unknown {
  let current = source;
  for (const part of pathParts) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

function readString(source: unknown, pathParts: string[]): string | null {
  const value = readUnknown(source, pathParts);
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(source: unknown, pathParts: string[]): number | null {
  const value = readUnknown(source, pathParts);
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toIsoDate(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value === "string" && value.length > 0) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return new Date(numeric).toISOString();
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}
