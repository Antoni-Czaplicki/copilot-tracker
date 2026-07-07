import { existsSync } from "node:fs";
import { copyFile, readFile, readdir, rm } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { logDebug, logInfo, logWarn } from "./logger";
import type { OtelSessionResolver } from "./otel";
import type { WorkspaceContext } from "./types";

interface WorkspaceStorageMatch {
  storagePath: string;
  chatSessionsPath: string;
  stateDbPath: string;
}

interface ScoredWorkspaceStorageMatch extends WorkspaceStorageMatch {
  score: number;
  reasons: string[];
}

interface WorkspaceStorageNeedles {
  exact: string[];
  folderNames: string[];
}

interface SessionIndexEntry {
  sessionId: string;
  title: string | null;
  createdAtMs: number | null;
  isEmpty: boolean;
}

interface SessionRequestTitleCandidate {
  sessionId: string;
  title: string;
  sessionCreatedAt: string | null;
  storagePath: string;
  storageScore: number;
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
  currentExtensionStoragePath?: string | null,
): Promise<OtelSessionResolver> {
  const storages = await findWorkspaceStorages(
    storageRoot,
    workspaceContext,
    currentExtensionStoragePath,
  );
  if (storages.length === 0) {
    return () => null;
  }

  const candidates: SessionRequestTitleCandidate[] = [];
  let indexedSessionCount = 0;
  for (const storage of storages) {
    const index = await readSessionIndex(storage.stateDbPath);
    indexedSessionCount += index.size;
    candidates.push(
      ...(await readChatSessionTitleCandidates(
        storage.chatSessionsPath,
        index,
        storage.storagePath,
        storage.score,
      )),
    );
  }
  candidates.sort(compareTitleCandidates);

  logInfo("Loaded VS Code chat session titles", {
    storageRoot,
    storageCount: storages.length,
    storagePaths: storages.map((storage) => ({
      storagePath: storage.storagePath,
      score: storage.score,
      reasons: storage.reasons,
    })),
    indexedSessionCount,
    titleCandidateCount: candidates.length,
  });

  return (request) => matchChatSessionTitle(request, candidates);
}

interface CachedChatSessionTitleResolver {
  resolver: OtelSessionResolver;
  builtAtMs: number;
}

const chatSessionTitleResolverCache = new Map<
  string,
  CachedChatSessionTitleResolver
>();

export async function createCachedChatSessionTitleResolver(
  workspaceContext: WorkspaceContext,
  storageRoot?: string,
  currentExtensionStoragePath?: string | null,
  // Rebuilding scans the whole workspaceStorage root and snapshots SQLite
  // databases, so keep the resolver alive well beyond the sync cadence.
  ttlMs = 300_000,
): Promise<OtelSessionResolver> {
  const cacheKey = `${workspaceContext.workspaceId}|${storageRoot ?? ""}|${
    currentExtensionStoragePath ?? ""
  }`;
  const cached = chatSessionTitleResolverCache.get(cacheKey);
  if (cached && Date.now() - cached.builtAtMs < ttlMs) {
    return cached.resolver;
  }

  const resolver = await createChatSessionTitleResolver(
    workspaceContext,
    storageRoot,
    currentExtensionStoragePath,
  );
  chatSessionTitleResolverCache.set(cacheKey, {
    resolver,
    builtAtMs: Date.now(),
  });
  return resolver;
}

export async function findWorkspaceStorage(
  storageRoot: string,
  workspaceContext: WorkspaceContext,
  currentExtensionStoragePath?: string | null,
): Promise<WorkspaceStorageMatch | null> {
  const matches = await findWorkspaceStorages(
    storageRoot,
    workspaceContext,
    currentExtensionStoragePath,
  );
  const first = matches[0];
  if (!first) {
    return null;
  }

  const second = matches[1];
  if (second && second.score === first.score) {
    logWarn("Multiple VS Code workspace storage matches have the same rank", {
      storageRoot,
      matches: matches.slice(0, 5).map((match) => ({
        storagePath: match.storagePath,
        score: match.score,
        reasons: match.reasons,
      })),
    });
  }

  return first;
}

export async function findWorkspaceStorages(
  storageRoot: string,
  workspaceContext: WorkspaceContext,
  currentExtensionStoragePath?: string | null,
): Promise<ScoredWorkspaceStorageMatch[]> {
  if (!existsSync(storageRoot)) {
    logWarn("VS Code workspace storage root does not exist", { storageRoot });
    return [];
  }

  const directMatch = getDirectStorageMatch(storageRoot);
  if (directMatch) {
    logInfo("Using direct VS Code workspace storage match", directMatch);
    return [{ ...directMatch, score: 10_000, reasons: ["direct-storage-root"] }];
  }

  const candidates = await readdir(storageRoot, { withFileTypes: true });
  const needles = createWorkspaceStorageNeedles(workspaceContext);
  const preferredStoragePaths = preferredWorkspaceStoragePaths(
    currentExtensionStoragePath,
  );
  const matches: ScoredWorkspaceStorageMatch[] = [];

  for (const candidate of candidates) {
    if (!candidate.isDirectory()) {
      continue;
    }

    const storagePath = path.join(storageRoot, candidate.name);
    const metadataStrings = await readWorkspaceStorageMetadataStrings(
      storagePath,
    );
    const match = scoreWorkspaceStorageMatch(
      storagePath,
      metadataStrings,
      needles,
      preferredStoragePaths,
    );
    if (match) {
      matches.push(match);
    }
  }

  matches.sort((first, second) => second.score - first.score);
  if (matches.length > 0) {
    logInfo("Found VS Code workspace storage matches", {
      storageRoot,
      matchCount: matches.length,
      matches: matches.slice(0, 10).map((match) => ({
        storagePath: match.storagePath,
        score: match.score,
        reasons: match.reasons,
      })),
    });
    return matches;
  }

  logWarn("Scanned VS Code storage root without finding workspace match", {
    storageRoot,
    candidateCount: candidates.length,
    exactNeedles: needles.exact,
    folderNames: needles.folderNames,
    preferredStoragePaths,
  });
  return [];
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

async function readWorkspaceStorageMetadataStrings(
  storagePath: string,
): Promise<string[]> {
  const metadataStrings: string[] = [];
  for (const fileName of ["workspace.json", "meta.json"]) {
    try {
      const metadata = await readFile(path.join(storagePath, fileName), "utf8");
      metadataStrings.push(metadata, ...collectJsonStrings(metadata));
    } catch {
      // VS Code storage folders do not always contain both metadata files.
    }
  }
  return metadataStrings;
}

function scoreWorkspaceStorageMatch(
  storagePath: string,
  metadataStrings: string[],
  needles: WorkspaceStorageNeedles,
  preferredStoragePaths: string[],
): ScoredWorkspaceStorageMatch | null {
  const reasons: string[] = [];
  let score = 0;
  const normalizedStoragePath = normalizePathForCompare(storagePath);
  const hasStateDb = existsSync(path.join(storagePath, "state.vscdb"));
  const hasChatSessions = existsSync(path.join(storagePath, "chatSessions"));

  if (
    normalizedStoragePath &&
    preferredStoragePaths.includes(normalizedStoragePath)
  ) {
    score += 1000;
    reasons.push("current-extension-storage");
  }

  if (includesAnyNeedle(metadataStrings, needles.exact)) {
    score += 500;
    reasons.push("workspace-metadata-exact");
  }

  if (hasWorkspaceFolderNameMatch(metadataStrings, needles)) {
    score += 100;
    reasons.push("workspace-folder-name");
  }

  if (hasChatSessions) {
    score += 25;
    reasons.push("has-chatSessions");
  }

  if (hasStateDb) {
    score += 25;
    reasons.push("has-state-db");
  }

  if (metadataStrings.length > 0) {
    score += 5;
    reasons.push("has-metadata");
  }

  if (score === 0) {
    return null;
  }

  return {
    storagePath,
    chatSessionsPath: path.join(storagePath, "chatSessions"),
    stateDbPath: path.join(storagePath, "state.vscdb"),
    score,
    reasons,
  };
}

function preferredWorkspaceStoragePaths(
  currentExtensionStoragePath: string | null | undefined,
) {
  if (!currentExtensionStoragePath) {
    return [];
  }

  const directStoragePath =
    path.basename(currentExtensionStoragePath) === "chatSessions" ||
    existsSync(path.join(currentExtensionStoragePath, "state.vscdb")) ||
    existsSync(path.join(currentExtensionStoragePath, "chatSessions"))
      ? currentExtensionStoragePath
      : path.dirname(currentExtensionStoragePath);
  return uniqueStrings([
    normalizePathForCompare(directStoragePath),
    normalizePathForCompare(removeStorageLockSuffix(directStoragePath)),
  ]);
}

function removeStorageLockSuffix(storagePath: string | null): string | null {
  if (!storagePath) {
    return null;
  }

  const basename = path.basename(storagePath);
  const suffixMatch = basename.match(/^(.+)-\d+$/u);
  if (!suffixMatch?.[1]) {
    return storagePath;
  }

  return path.join(path.dirname(storagePath), suffixMatch[1]);
}

function normalizePathForCompare(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = path.resolve(value).replace(/\\/gu, "/");
  return process.platform === "linux" ? normalized : normalized.toLowerCase();
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
  // Never open the live database directly: state.vscdb belongs to the running
  // VS Code process and is mid-write while we read. A fault inside the
  // synchronous native SQLite bindings is not catchable and would kill the
  // whole extension host, so query a snapshot copy instead. At worst the copy
  // is slightly stale or corrupt, which surfaces as a catchable JS error.
  const snapshotPath = path.join(
    os.tmpdir(),
    `copilot-tracker-state-${process.pid}-${crypto.randomUUID()}.vscdb`,
  );
  await copyFile(stateDbPath, snapshotPath);
  try {
    return await readSessionIndexValueFromSnapshot(snapshotPath);
  } finally {
    await rm(snapshotPath, { force: true });
  }
}

async function readSessionIndexValueFromSnapshot(
  snapshotPath: string,
): Promise<string> {
  const { DatabaseSync } = await import("node:sqlite");
  const database = new DatabaseSync(snapshotPath, { readOnly: true });
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
      isEmpty: rawEntry.isEmpty === true,
    });
  }
}

async function readChatSessionTitleCandidates(
  chatSessionsPath: string,
  index: Map<string, SessionIndexEntry>,
  storagePath: string,
  storageScore: number,
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
        storagePath,
        storageScore,
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
      storagePath,
      storageScore,
    });
  }

  return candidates;
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
  storagePath: string,
  storageScore: number,
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
    } else if (kind === null && isChatSessionRecord(record)) {
      sessionId = readString(record, "sessionId") ?? sessionId;
      createdAtMs =
        readFirstTimestamp(record, [
          ["creationDate"],
          ["createdAt"],
          ["created"],
        ]) ?? createdAtMs;
      fileTitle = readSessionTitle(record) ?? fileTitle;
    } else if (kind === 1) {
      fileTitle = readTitlePatch(record) ?? fileTitle;
    }
  }

  const indexEntry = index.get(sessionId) ?? index.get(sessionIdFromFile);
  const title = indexEntry?.title ?? fileTitle;
  if (!title || indexEntry?.isEmpty) {
    return [];
  }

  const sessionCreatedAt = toIsoDate(indexEntry?.createdAtMs ?? createdAtMs);
  return [
    {
      sessionId,
      title,
      sessionCreatedAt,
      storagePath,
      storageScore,
    },
  ];
}

function matchChatSessionTitle(
  request: Parameters<OtelSessionResolver>[0],
  candidates: SessionRequestTitleCandidate[],
) {
  if (!request.conversationId) {
    return null;
  }

  const exactMatch = candidates.find(
    (candidate) => candidate.sessionId === request.conversationId,
  );
  if (!exactMatch) {
    return null;
  }

  return {
    sessionId: exactMatch.sessionId,
    sessionTitle: exactMatch.title,
    sessionCreatedAt: exactMatch.sessionCreatedAt,
  };
}

function compareTitleCandidates(
  first: SessionRequestTitleCandidate,
  second: SessionRequestTitleCandidate,
) {
  return second.storageScore - first.storageScore;
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
  // Date#toISOString throws a RangeError outside the representable range.
  if (value === null || Math.abs(value) > 8_640_000_000_000_000) {
    return null;
  }

  return new Date(value).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
