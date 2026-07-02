import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { logDebug, logInfo, logWarn } from "./logger";
import type { OtelSessionResolver } from "./otel";
import type { WorkspaceContext } from "./types";

const matchWindowMs = 10 * 60 * 1000;

interface WorkspaceStorageMatch {
  storagePath: string;
  chatSessionsPath: string;
  stateDbPath: string;
}

interface WorkspaceStorageNeedles {
  exact: string[];
  folderNames: string[];
}

interface SessionIndexEntry {
  sessionId: string;
  title: string | null;
  createdAtMs: number | null;
  lastMessageDateMs: number | null;
  isEmpty: boolean;
}

interface SessionRequestTitleCandidate {
  sessionId: string;
  title: string;
  sessionCreatedAt: string | null;
  timestampsMs: number[];
}

interface MutableChatRequest {
  timestampsMs: number[];
}

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

export async function createChatSessionTitleResolver(
  workspaceContext: WorkspaceContext,
  storageRoot = getDefaultWorkspaceStorageRoot(),
): Promise<OtelSessionResolver> {
  const storage = await findWorkspaceStorage(storageRoot, workspaceContext);
  if (!storage) {
    return () => null;
  }

  const index = await readSessionIndex(storage.stateDbPath);
  const candidates = await readChatSessionTitleCandidates(
    storage.chatSessionsPath,
    index,
  );
  logInfo("Loaded VS Code chat session titles", {
    storagePath: storage.storagePath,
    indexedSessionCount: index.size,
    titleCandidateCount: candidates.length,
  });

  return (request) => matchChatSessionTitle(request, candidates);
}

export async function findWorkspaceStorage(
  storageRoot: string,
  workspaceContext: WorkspaceContext,
): Promise<WorkspaceStorageMatch | null> {
  if (!existsSync(storageRoot)) {
    logWarn("VS Code workspace storage root does not exist", { storageRoot });
    return null;
  }

  const directMatch = getDirectStorageMatch(storageRoot);
  if (directMatch) {
    logInfo("Using direct VS Code workspace storage match", directMatch);
    return directMatch;
  }

  const candidates = await readdir(storageRoot, { withFileTypes: true });
  const needles = createWorkspaceStorageNeedles(workspaceContext);
  const folderNameMatches: WorkspaceStorageMatch[] = [];

  for (const candidate of candidates) {
    if (!candidate.isDirectory()) {
      continue;
    }

    const storagePath = path.join(storageRoot, candidate.name);
    const workspaceJsonPath = path.join(storagePath, "workspace.json");
    try {
      const workspaceJson = await readFile(workspaceJsonPath, "utf8");
      const workspaceJsonStrings = collectJsonStrings(workspaceJson);
      const match = {
        storagePath,
        chatSessionsPath: path.join(storagePath, "chatSessions"),
        stateDbPath: path.join(storagePath, "state.vscdb"),
      };
      if (
        includesAnyNeedle(
          [workspaceJson, ...workspaceJsonStrings],
          needles.exact,
        )
      ) {
        return match;
      }

      if (hasWorkspaceFolderNameMatch(workspaceJsonStrings, needles)) {
        folderNameMatches.push(match);
      }
    } catch {
      // Not a workspace storage directory.
    }
  }

  if (folderNameMatches.length === 1) {
    logInfo("Using VS Code workspace storage match by workspace folder name", {
      ...folderNameMatches[0],
      folderNames: needles.folderNames,
    });
    return folderNameMatches[0] ?? null;
  }

  logWarn("Scanned VS Code storage root without finding workspace match", {
    storageRoot,
    candidateCount: candidates.length,
    exactNeedles: needles.exact,
    folderNames: needles.folderNames,
    folderNameMatchCount: folderNameMatches.length,
  });
  return null;
}

function createWorkspaceStorageNeedles(
  workspaceContext: WorkspaceContext,
): WorkspaceStorageNeedles {
  const workspacePaths = uniqueStrings([
    workspaceContext.workspacePath,
    workspaceContext.repositoryRoot,
    workspaceContext.workspaceFilePath,
    ...workspaceContext.workspaceFolderPaths,
  ]);

  return {
    exact: uniqueStrings(workspacePaths.flatMap(workspacePathNeedles)),
    folderNames: uniqueStrings([
      ...workspacePaths.map(workspaceFolderName).filter(isNonEmptyString),
      workspaceContext.workspaceName,
    ]),
  };
}

function workspacePathNeedles(workspacePath: string): string[] {
  const trimmed = workspacePath.trim();
  if (!trimmed) {
    return [];
  }

  const slashPath = trimmed.replace(/\\/gu, "/");
  return uniqueStrings([
    trimmed,
    slashPath,
    encodeURI(trimmed),
    encodeURI(slashPath),
    ...fileUriNeedles(slashPath),
  ]);
}

function fileUriNeedles(slashPath: string): string[] {
  const windowsPath = slashPath.match(/^([A-Za-z]):\/(.+)$/u);
  if (windowsPath) {
    const drive = windowsPath[1];
    const rest = windowsPath[2];
    if (!drive || !rest) {
      return [];
    }

    const encodedRest = encodePathSegments(rest);
    return [
      `file:///${drive}:/${rest}`,
      `file:///${drive}:/${encodedRest}`,
      `file:///${drive.toLowerCase()}%3A/${encodedRest}`,
      `file:///${drive.toUpperCase()}%3A/${encodedRest}`,
    ];
  }

  if (slashPath.startsWith("/")) {
    return [`file://${slashPath}`, `file://${encodePathSegments(slashPath)}`];
  }

  return [];
}

function encodePathSegments(pathValue: string): string {
  return pathValue.split("/").map(encodeURIComponent).join("/");
}

function includesAnyNeedle(haystacks: string[], needles: string[]): boolean {
  return haystacks.some((haystack) =>
    needles.some((needle) => includesNeedle(haystack, needle)),
  );
}

function includesNeedle(haystack: string, needle: string): boolean {
  return (
    haystack.includes(needle) ||
    haystack.toLowerCase().includes(needle.toLowerCase())
  );
}

function hasWorkspaceFolderNameMatch(
  workspaceJsonStrings: string[],
  needles: WorkspaceStorageNeedles,
) {
  return workspaceJsonStrings.some((value) => {
    const folderName = workspaceFolderName(value);
    return (
      folderName !== null &&
      needles.folderNames.some(
        (needle) => needle.toLowerCase() === folderName.toLowerCase(),
      )
    );
  });
}

function collectJsonStrings(json: string): string[] {
  const parsed = safeJsonParse(json);
  const strings: string[] = [];
  collectStrings(parsed, strings);
  return strings;
}

function collectStrings(value: unknown, strings: string[]) {
  if (typeof value === "string") {
    strings.push(value);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((nestedValue) => collectStrings(nestedValue, strings));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  Object.values(value).forEach((nestedValue) =>
    collectStrings(nestedValue, strings),
  );
}

function workspaceFolderName(value: string): string | null {
  let pathLike = value.trim();
  if (!pathLike) {
    return null;
  }

  try {
    const uri = new URL(pathLike);
    pathLike = decodeURIComponent(uri.pathname || uri.hostname || pathLike);
  } catch {
    try {
      pathLike = decodeURIComponent(pathLike);
    } catch {
      // Keep the original value.
    }
  }

  pathLike = pathLike.replace(/^\/([A-Za-z]:\/)/u, "$1");
  const segments = pathLike
    .replace(/\\/gu, "/")
    .replace(/\/+$/u, "")
    .split("/")
    .filter(Boolean);
  return segments.at(-1) ?? null;
}

function uniqueStrings(values: (string | null)[]): string[] {
  return [...new Set(values.filter(isNonEmptyString))];
}

function isNonEmptyString(value: string | null): value is string {
  return value !== null && value.trim().length > 0;
}

function getDirectStorageMatch(
  storageRoot: string,
): WorkspaceStorageMatch | null {
  if (path.basename(storageRoot) === "chatSessions") {
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

async function readSessionIndex(
  stateDbPath: string,
): Promise<Map<string, SessionIndexEntry>> {
  const entries = new Map<string, SessionIndexEntry>();
  if (!existsSync(stateDbPath)) {
    return entries;
  }

  try {
    const indexValue = await readSessionIndexValue(stateDbPath);
    readSessionIndexEntries(indexValue, entries);
  } catch (error) {
    logWarn("Could not read VS Code chat session index", {
      stateDbPath,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return entries;
}

async function readSessionIndexValue(stateDbPath: string): Promise<string> {
  const { DatabaseSync } = await import("node:sqlite");
  const database = new DatabaseSync(stateDbPath, { readOnly: true });
  try {
    const row = database
      .prepare(
        "SELECT value FROM ItemTable WHERE key = 'chat.ChatSessionStore.index';",
      )
      .get();
    const value = row?.value;
    if (typeof value === "string") {
      return value;
    }
    if (value instanceof Uint8Array) {
      return new TextDecoder().decode(value);
    }
    return "";
  } finally {
    database.close();
  }
}

function readSessionIndexEntries(
  indexValue: string,
  entries: Map<string, SessionIndexEntry>,
) {
  const parsed = JSON.parse(indexValue.trim()) as {
    entries?: Record<string, unknown>;
  };
  for (const [sessionId, rawEntry] of Object.entries(parsed.entries ?? {})) {
    if (!isRecord(rawEntry)) {
      continue;
    }
    const entrySessionId = readString(rawEntry, "sessionId") ?? sessionId;
    entries.set(entrySessionId, {
      sessionId: entrySessionId,
      title: readSessionTitle(rawEntry),
      createdAtMs: readFirstTimestamp(rawEntry, [
        ["timing", "created"],
        ["createdAt"],
        ["creationDate"],
        ["created"],
      ]),
      lastMessageDateMs: readFirstTimestamp(rawEntry, [
        ["lastMessageDate"],
        ["timing", "lastRequestEnded"],
        ["timing", "lastRequestStarted"],
        ["updatedAt"],
        ["modifiedAt"],
      ]),
      isEmpty: rawEntry.isEmpty === true,
    });
  }
}

async function readChatSessionTitleCandidates(
  chatSessionsPath: string,
  index: Map<string, SessionIndexEntry>,
): Promise<SessionRequestTitleCandidate[]> {
  const files = await findChatSessionFiles(chatSessionsPath);
  const candidates: SessionRequestTitleCandidate[] = [];
  const sessionIdsWithFiles = new Set<string>();

  for (const file of files) {
    try {
      const sessionIdFromFile = path
        .basename(file)
        .replace(/\.(jsonl|json)$/iu, "");
      const fileCandidates = await readChatSessionFileCandidates(
        file,
        sessionIdFromFile,
        index,
      );
      for (const candidate of fileCandidates) {
        sessionIdsWithFiles.add(candidate.sessionId);
        candidates.push(candidate);
      }
    } catch (error) {
      logDebug("Ignored unreadable VS Code chat session file", {
        file,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const entry of index.values()) {
    if (
      sessionIdsWithFiles.has(entry.sessionId) ||
      !entry.title ||
      entry.isEmpty
    ) {
      continue;
    }
    candidates.push({
      sessionId: entry.sessionId,
      title: entry.title,
      sessionCreatedAt: toIsoDate(entry.createdAtMs),
      timestampsMs: uniqueNumbers([entry.lastMessageDateMs, entry.createdAtMs]),
    });
  }

  return candidates.filter((candidate) => candidate.timestampsMs.length > 0);
}

async function findChatSessionFiles(root: string): Promise<string[]> {
  if (!existsSync(root)) {
    return [];
  }

  const files: string[] = [];
  await walk(root, files);
  return files.filter((file) => /\.(jsonl|json)$/iu.test(file)).sort();
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

async function readChatSessionFileCandidates(
  file: string,
  sessionIdFromFile: string,
  index: Map<string, SessionIndexEntry>,
): Promise<SessionRequestTitleCandidate[]> {
  const text = await readFile(file, "utf8");
  const records = file.endsWith(".jsonl")
    ? text
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => safeJsonParse(line))
        .filter((record): record is unknown => Boolean(record))
    : [safeJsonParse(text)].filter((record): record is unknown =>
        Boolean(record),
      );

  let sessionId = sessionIdFromFile;
  let createdAtMs: number | null = null;
  let fileTitle: string | null = null;
  const requests = new Map<number, MutableChatRequest>();

  for (const record of records) {
    if (!isRecord(record)) {
      continue;
    }

    const kind = readNumber(record.kind);
    const value = record.v;
    if (kind === 0 && isRecord(value)) {
      sessionId = readString(value, "sessionId") ?? sessionId;
      createdAtMs =
        readFirstTimestamp(value, [
          ["creationDate"],
          ["createdAt"],
          ["created"],
        ]) ?? createdAtMs;
      fileTitle = readSessionTitle(value) ?? fileTitle;
      readRequestArray(value.requests, requests);
    } else if (kind === null && isChatSessionRecord(record)) {
      sessionId = readString(record, "sessionId") ?? sessionId;
      createdAtMs =
        readFirstTimestamp(record, [
          ["creationDate"],
          ["createdAt"],
          ["created"],
        ]) ?? createdAtMs;
      fileTitle = readSessionTitle(record) ?? fileTitle;
      readRequestArray(record.requests, requests);
    } else if (kind === 1) {
      fileTitle = readTitlePatch(record) ?? fileTitle;
      readRequestPatch(record, requests);
    } else if (kind === 2) {
      readRequestArray(value, requests);
    }
  }

  const indexEntry = index.get(sessionId) ?? index.get(sessionIdFromFile);
  const title = indexEntry?.title ?? fileTitle;
  if (!title || indexEntry?.isEmpty) {
    return [];
  }

  const sessionCreatedAt = toIsoDate(indexEntry?.createdAtMs ?? createdAtMs);
  const sessionTimes = [
    indexEntry?.lastMessageDateMs ?? null,
    indexEntry?.createdAtMs ?? null,
  ];
  const values = [...requests.values()];
  if (values.length === 0) {
    return [
      {
        sessionId,
        title,
        sessionCreatedAt,
        timestampsMs: uniqueNumbers([...sessionTimes, createdAtMs]),
      },
    ];
  }

  return values.map((request) => ({
    sessionId,
    title,
    sessionCreatedAt,
    timestampsMs: uniqueNumbers([...request.timestampsMs, ...sessionTimes]),
  }));
}

function readRequestArray(
  value: unknown,
  requests: Map<number, MutableChatRequest>,
) {
  if (!Array.isArray(value)) {
    return;
  }

  value.forEach((request, index) => {
    if (!isRecord(request)) {
      return;
    }
    const mutable = getMutableRequest(requests, index);
    pushTimestamp(mutable, request.timestamp);
    pushTimestamp(mutable, readUnknown(request, ["modelState", "completedAt"]));
    pushTimestamp(mutable, readUnknown(request, ["result", "completedAt"]));
  });
}

function readRequestPatch(
  record: Record<string, unknown>,
  requests: Map<number, MutableChatRequest>,
) {
  const key = record.k;
  if (
    !Array.isArray(key) ||
    key[0] !== "requests" ||
    typeof key[1] !== "number"
  ) {
    return;
  }

  const mutable = getMutableRequest(requests, key[1]);
  const field = key[2];
  if (field === "timestamp") {
    pushTimestamp(mutable, record.v);
  } else if (field === "modelState" || field === "result") {
    pushTimestamp(mutable, readUnknown(record.v, ["completedAt"]));
  }
}

function getMutableRequest(
  requests: Map<number, MutableChatRequest>,
  index: number,
) {
  const existing = requests.get(index);
  if (existing) {
    return existing;
  }

  const created = { timestampsMs: [] };
  requests.set(index, created);
  return created;
}

function pushTimestamp(request: MutableChatRequest, value: unknown) {
  const timestamp = readTimestamp(value);
  if (timestamp !== null) {
    request.timestampsMs.push(timestamp);
  }
}

function matchChatSessionTitle(
  request: Parameters<OtelSessionResolver>[0],
  candidates: SessionRequestTitleCandidate[],
) {
  if (request.conversationId) {
    const exactMatch = candidates.find(
      (candidate) => candidate.sessionId === request.conversationId,
    );
    if (exactMatch) {
      return {
        sessionId: exactMatch.sessionId,
        sessionTitle: exactMatch.title,
        sessionCreatedAt: exactMatch.sessionCreatedAt,
      };
    }
  }

  const requestTimes = uniqueNumbers([
    toTimestampMs(request.requestCompletedAt),
    toTimestampMs(request.requestStartedAt),
    toTimestampMs(request.sessionCreatedAt),
  ]);
  if (requestTimes.length === 0) {
    return null;
  }

  let best: {
    candidate: SessionRequestTitleCandidate;
    distanceMs: number;
  } | null = null;

  for (const candidate of candidates) {
    for (const requestTime of requestTimes) {
      for (const sessionTime of candidate.timestampsMs) {
        const distanceMs = Math.abs(requestTime - sessionTime);
        if (!best || distanceMs < best.distanceMs) {
          best = { candidate, distanceMs };
        }
      }
    }
  }

  if (!best || best.distanceMs > matchWindowMs) {
    return null;
  }

  return {
    sessionId: best.candidate.sessionId,
    sessionTitle: best.candidate.title,
    sessionCreatedAt: best.candidate.sessionCreatedAt,
  };
}

function cleanSessionTitle(value: string | null) {
  const title = value?.trim();
  if (!title || title === "New Chat") {
    return null;
  }

  return title;
}

function readSessionTitle(value: unknown): string | null {
  if (!isRecord(value)) {
    return typeof value === "string" ? cleanSessionTitle(value) : null;
  }

  return cleanSessionTitle(
    readString(value, "customTitle") ??
      readString(value, "title") ??
      readString(value, "name") ??
      readString(value, "label") ??
      readString(value, "displayName") ??
      readString(readUnknown(value, ["metadata"]), "title") ??
      readString(readUnknown(value, ["metadata"]), "customTitle") ??
      readString(readUnknown(value, ["v"]), "customTitle") ??
      readString(readUnknown(value, ["v"]), "title"),
  );
}

function readTitlePatch(record: Record<string, unknown>): string | null {
  const key = record.k;
  if (key === "customTitle" || key === "title") {
    return readSessionTitle(record.v);
  }

  if (
    Array.isArray(key) &&
    key.some((part) => part === "customTitle" || part === "title")
  ) {
    return readSessionTitle(record.v);
  }

  return readSessionTitle(record);
}

function isChatSessionRecord(value: Record<string, unknown>) {
  return "sessionId" in value || "requests" in value || "creationDate" in value;
}

function uniqueNumbers(values: (number | null)[]) {
  return [
    ...new Set(values.filter((value): value is number => value !== null)),
  ];
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

function readFirstTimestamp(
  source: Record<string, unknown>,
  paths: string[][],
): number | null {
  for (const pathParts of paths) {
    const value = readTimestamp(readUnknown(source, pathParts));
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function readString(
  source: unknown,
  key: string,
): string | null {
  if (!isRecord(source)) {
    return null;
  }

  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }

    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  return null;
}

function toIsoDate(value: number | null) {
  return value === null ? null : new Date(value).toISOString();
}

function toTimestampMs(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
