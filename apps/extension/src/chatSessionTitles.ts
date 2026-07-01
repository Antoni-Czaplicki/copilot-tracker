import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

import { logDebug, logInfo, logWarn } from "./logger";
import type { OtelSessionResolver } from "./otel";
import type { WorkspaceContext } from "./types";

const execFileAsync = promisify(execFile);
const matchWindowMs = 10 * 60 * 1000;

interface WorkspaceStorageMatch {
  storagePath: string;
  chatSessionsPath: string;
  stateDbPath: string;
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

async function findWorkspaceStorage(
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
    const { stdout } = await execFileAsync("sqlite3", [
      "-readonly",
      stateDbPath,
      "SELECT value FROM ItemTable WHERE key = 'chat.ChatSessionStore.index';",
    ]);
    const parsed = JSON.parse(stdout.trim()) as {
      entries?: Record<string, unknown>;
    };
    for (const [sessionId, rawEntry] of Object.entries(parsed.entries ?? {})) {
      if (!isRecord(rawEntry)) {
        continue;
      }
      const entrySessionId = readString(rawEntry, "sessionId") ?? sessionId;
      entries.set(entrySessionId, {
        sessionId: entrySessionId,
        title: cleanSessionTitle(readString(rawEntry, "title")),
        createdAtMs: readNumber(readUnknown(rawEntry, ["timing", "created"])),
        lastMessageDateMs: readNumber(rawEntry.lastMessageDate),
        isEmpty: rawEntry.isEmpty === true,
      });
    }
  } catch (error) {
    logWarn("Could not read VS Code chat session index", {
      stateDbPath,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return entries;
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
  const requests = new Map<number, MutableChatRequest>();

  for (const record of records) {
    if (!isRecord(record)) {
      continue;
    }

    const kind = readNumber(record.kind);
    const value = record.v;
    if (kind === 0 && isRecord(value)) {
      sessionId = readString(value, "sessionId") ?? sessionId;
      createdAtMs = readNumber(value.creationDate) ?? createdAtMs;
      readRequestArray(value.requests, requests);
    } else if (kind === 1) {
      readRequestPatch(record, requests);
    } else if (kind === 2) {
      readRequestArray(value, requests);
    }
  }

  const indexEntry = index.get(sessionId) ?? index.get(sessionIdFromFile);
  const title = indexEntry?.title;
  if (!title || indexEntry?.isEmpty) {
    return [];
  }

  const sessionCreatedAt = toIsoDate(indexEntry.createdAtMs ?? createdAtMs);
  const sessionTimes = [indexEntry.lastMessageDateMs, indexEntry.createdAtMs];
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
  const timestamp = readNumber(value);
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

function readString(
  source: Record<string, unknown>,
  key: string,
): string | null {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
