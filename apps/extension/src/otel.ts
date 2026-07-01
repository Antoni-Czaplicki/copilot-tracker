import { existsSync } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";

import { logDebug, logInfo, logWarn } from "./logger";
import { TrackerConfig } from "./trackerClient";
import {
  CopilotChatRequest,
  PromptTokenDetail,
  WorkspaceContext,
} from "./types";

interface ParsedOtelRequest {
  recordId: string;
  traceId: string;
  spanId: string | null;
  conversationId: string | null;
  agentName: string | null;
  repositoryRemoteUrl: string | null;
  branch: string | null;
  sessionCreatedAt: string | null;
  requestStartedAt: string | null;
  requestCompletedAt: string | null;
  modelId: string | null;
  resolvedModel: string | null;
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

interface OtelSpan {
  traceId: string;
  spanId: string | null;
  parentSpanId: string | null;
  name: string;
  startTime: string | null;
  endTime: string | null;
  attributes: Record<string, unknown>;
  resourceAttributes: Record<string, unknown>;
}

interface TraceGroup {
  spans: OtelSpan[];
  invokeSpan: OtelSpan | null;
  chatSpans: OtelSpan[];
}

interface OtelLogRecord {
  traceId: string;
  spanId: string | null;
  timestamp: string | null;
  body: string | null;
  attributes: Record<string, unknown>;
  resourceAttributes: Record<string, unknown>;
}

interface LogRecordGroup {
  records: OtelLogRecord[];
  sessionStart: OtelLogRecord | null;
  inferenceRecords: OtelLogRecord[];
  turnRecords: OtelLogRecord[];
}

export type RequestTaskResolver = (
  request: Pick<
    ParsedOtelRequest,
    "traceId" | "conversationId" | "requestStartedAt" | "requestCompletedAt"
  >,
) => RequestTaskResolution | null | undefined;

export interface OtelSessionLookupRequest {
  traceId: string;
  conversationId: string | null;
  requestStartedAt: string | null;
  requestCompletedAt: string | null;
  sessionCreatedAt: string | null;
  modelId: string | null;
  resolvedModel: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface OtelSessionLookupResult {
  sessionId: string | null;
  sessionTitle: string | null;
  sessionCreatedAt: string | null;
}

export type OtelSessionResolver = (
  request: OtelSessionLookupRequest,
) => OtelSessionLookupResult | null | undefined;

let lastCopilotOtelConfigurationWriteAt = 0;

export function getLastCopilotOtelConfigurationWriteAt() {
  return lastCopilotOtelConfigurationWriteAt;
}

export function getDefaultOtelFilePath(context: vscode.ExtensionContext) {
  return path.join(context.globalStorageUri.fsPath, "copilot-otel.jsonl");
}

export function resolveOtelFilePath(
  context: vscode.ExtensionContext,
  config: TrackerConfig,
) {
  return config.otelFilePath || getDefaultOtelFilePath(context);
}

export async function ensureCopilotOtelConfiguration(
  context: vscode.ExtensionContext,
  config: TrackerConfig,
): Promise<string> {
  const otelFilePath = resolveOtelFilePath(context, config);
  await mkdir(path.dirname(otelFilePath), { recursive: true });

  const copilotConfig = vscode.workspace.getConfiguration(
    "github.copilot.chat.otel",
  );
  const updatedSettings = [];
  if (await updateConfigurationValue(copilotConfig, "enabled", true)) {
    updatedSettings.push("enabled");
  }
  if (await updateConfigurationValue(copilotConfig, "exporterType", "file")) {
    updatedSettings.push("exporterType");
  }
  if (await updateConfigurationValue(copilotConfig, "outfile", otelFilePath)) {
    updatedSettings.push("outfile");
  }
  if (
    await updateConfigurationValue(copilotConfig, "captureContent", false)
  ) {
    updatedSettings.push("captureContent");
  }

  if (updatedSettings.length > 0) {
    logInfo("Copilot OTel file exporter configured", {
      otelFilePath,
      captureContent: false,
      updatedSettingCount: updatedSettings.length,
      updatedSettings,
    });
  } else {
    logDebug("Copilot OTel file exporter already configured", {
      otelFilePath,
    });
  }
  return otelFilePath;
}

export async function getOtelFileSignature(otelFilePath: string) {
  if (!existsSync(otelFilePath)) {
    return "missing";
  }

  const fileStat = await stat(otelFilePath);
  return `${fileStat.size}:${fileStat.mtimeMs}`;
}

export function createOtelFileWatcher(
  otelFilePath: string,
  onChanged: () => void,
): vscode.Disposable[] {
  const rootUri = vscode.Uri.file(path.dirname(otelFilePath));
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(rootUri, path.basename(otelFilePath)),
  );

  return [
    watcher,
    watcher.onDidCreate(onChanged),
    watcher.onDidChange(onChanged),
    watcher.onDidDelete(onChanged),
  ];
}

export async function readCopilotOtelRequests(
  workspaceContext: WorkspaceContext,
  otelFilePath: string,
  resolveTaskForRequest?: RequestTaskResolver,
  resolveSessionForRequest?: OtelSessionResolver,
): Promise<CopilotChatRequest[]> {
  if (!existsSync(otelFilePath)) {
    logWarn("Copilot OTel file does not exist yet", { otelFilePath });
    return [];
  }

  logInfo("Reading Copilot OTel requests", {
    otelFilePath,
    workspacePath: workspaceContext.workspacePath,
    repositoryRoot: workspaceContext.repositoryRoot,
    repositoryRemoteUrl: workspaceContext.repositoryRemoteUrl,
  });
  const text = await readFile(otelFilePath, "utf8");
  const records = text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => safeJsonParse(line))
    .filter((record): record is unknown => Boolean(record));
  const spans = records.flatMap((record) => collectOtelSpans(record));
  const logRecords = records.flatMap((record) => collectOtelLogRecords(record));
  const parsedRequests = [
    ...parseOtelRequests(spans),
    ...parseOtelLogRequests(logRecords),
  ];
  const requests = parsedRequests.flatMap((request) => {
    const sessionMatch = resolveSessionForRequest?.(request) ?? null;
    if (!belongsToWorkspace(request, workspaceContext, sessionMatch)) {
      return [];
    }

    const requestWorkspaceContext = {
      ...workspaceContext,
      branch: request.branch ?? workspaceContext.branch,
      repositoryRemoteUrl:
        request.repositoryRemoteUrl ?? workspaceContext.repositoryRemoteUrl,
      ...(resolveTaskForRequest?.(request) ?? {}),
    };
    const inputTokens = request.inputTokens;
    const outputTokens = request.outputTokens;
    const tokenCapture = summarizeTokenCapture(inputTokens, outputTokens);

    return {
      ...requestWorkspaceContext,
      requestRecordId: request.recordId,
      requestId: request.traceId,
      responseId: request.spanId,
      sessionId:
        request.conversationId ?? sessionMatch?.sessionId ?? request.traceId,
      sessionTitle:
        sessionMatch?.sessionTitle ??
        buildOtelSessionTitle(request, requestWorkspaceContext),
      sessionCreatedAt:
        sessionMatch?.sessionCreatedAt ?? request.sessionCreatedAt ?? null,
      requestStartedAt: request.requestStartedAt,
      requestCompletedAt: request.requestCompletedAt,
      modelId: request.modelId,
      resolvedModel: request.resolvedModel,
      modelName: null,
      modelVendor: null,
      modelFamily: null,
      inputTokens,
      outputTokens,
      totalTokens: tokenCapture.totalTokens,
      tokenSource: tokenCapture.tokenSource,
      promptTokenDetails: request.promptTokenDetails,
      toolCallRoundCount: request.toolCallRoundCount,
      stopReasons: request.stopReasons,
      capturedAt: new Date().toISOString(),
    };
  });
  const dedupedRequests = dedupeChatRequests(requests);
  logInfo("Finished reading Copilot OTel requests", {
    spanCount: spans.length,
    logRecordCount: logRecords.length,
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

function parseOtelRequests(spans: OtelSpan[]): ParsedOtelRequest[] {
  const traces = new Map<string, TraceGroup>();
  for (const span of spans) {
    const trace = traces.get(span.traceId) ?? {
      spans: [],
      invokeSpan: null,
      chatSpans: [],
    };
    trace.spans.push(span);
    if (isInvokeAgentSpan(span)) {
      trace.invokeSpan = choosePreferredSpan(trace.invokeSpan, span);
    }
    if (isChatSpan(span)) {
      trace.chatSpans.push(span);
    }
    traces.set(span.traceId, trace);
  }

  return [...traces.values()]
    .map((trace) => traceToRequest(trace))
    .filter((request): request is ParsedOtelRequest => Boolean(request));
}

function traceToRequest(trace: TraceGroup): ParsedOtelRequest | null {
  const sourceSpan = trace.invokeSpan ?? trace.chatSpans[0] ?? trace.spans[0];
  if (!sourceSpan) {
    return null;
  }

  const spans = trace.spans;
  const chatSpans = trace.chatSpans;
  const attributes = mergeAttributes(
    sourceSpan.resourceAttributes,
    sourceSpan.attributes,
  );
  const inputTokens =
    readNumber(attributes, "gen_ai.usage.input_tokens") ??
    sumSpanNumbers(chatSpans, "gen_ai.usage.input_tokens");
  const outputTokens =
    readNumber(attributes, "gen_ai.usage.output_tokens") ??
    sumSpanNumbers(chatSpans, "gen_ai.usage.output_tokens");
  const requestStartedAt = earliestTimestamp(
    spans.map((span) => span.startTime),
  );
  const requestCompletedAt = latestTimestamp(spans.map((span) => span.endTime));

  return {
    recordId: `otel:${sourceSpan.traceId}`,
    traceId: sourceSpan.traceId,
    spanId: sourceSpan.spanId,
    conversationId:
      readString(attributes, "gen_ai.conversation.id") ??
      readString(attributes, "session.id"),
    agentName: readString(attributes, "gen_ai.agent.name"),
    repositoryRemoteUrl:
      readString(attributes, "github.copilot.git.repository") ??
      readString(attributes, "copilot_chat.repo.remote_url"),
    branch:
      readString(attributes, "github.copilot.git.branch") ??
      readString(attributes, "copilot_chat.repo.head_branch_name"),
    sessionCreatedAt: null,
    requestStartedAt,
    requestCompletedAt,
    modelId:
      readString(attributes, "gen_ai.request.model") ??
      firstSpanString(chatSpans, "gen_ai.request.model"),
    resolvedModel:
      readString(attributes, "gen_ai.response.model") ??
      firstSpanString(chatSpans, "gen_ai.response.model"),
    inputTokens,
    outputTokens,
    promptTokenDetails: [],
    toolCallRoundCount:
      readNumber(attributes, "copilot_chat.turn_count") ?? chatSpans.length,
    stopReasons: collectStopReasons(chatSpans),
  };
}

function parseOtelLogRequests(
  logRecords: OtelLogRecord[],
): ParsedOtelRequest[] {
  const groups = new Map<string, LogRecordGroup>();
  for (const record of logRecords) {
    const group = groups.get(record.traceId) ?? {
      records: [],
      sessionStart: null,
      inferenceRecords: [],
      turnRecords: [],
    };
    group.records.push(record);

    const eventName = readString(record.attributes, "event.name");
    if (eventName === "copilot_chat.session.start") {
      group.sessionStart = chooseEarlierLogRecord(group.sessionStart, record);
    } else if (eventName === "gen_ai.client.inference.operation.details") {
      group.inferenceRecords.push(record);
    } else if (eventName === "copilot_chat.agent.turn") {
      group.turnRecords.push(record);
    }

    groups.set(record.traceId, group);
  }

  return [...groups.values()]
    .flatMap((group) => logGroupToRequests(group))
    .filter((request): request is ParsedOtelRequest => Boolean(request));
}

function logGroupToRequests(group: LogRecordGroup): ParsedOtelRequest[] {
  if (group.inferenceRecords.length > 0) {
    return group.inferenceRecords.map((record, index) =>
      logRecordToRequest(record, group, index),
    );
  }

  return group.turnRecords.map((record, index) =>
    logRecordToRequest(record, group, index),
  );
}

function logRecordToRequest(
  record: OtelLogRecord,
  group: LogRecordGroup,
  index: number,
): ParsedOtelRequest {
  const matchingTurn =
    group.turnRecords.find((turn) => turn.spanId === record.spanId) ??
    group.turnRecords[index] ??
    null;
  const attributes = mergeAttributes(
    record.resourceAttributes,
    group.sessionStart?.attributes ?? {},
    matchingTurn?.attributes ?? {},
    record.attributes,
  );
  const responseId = readString(attributes, "gen_ai.response.id");
  const spanOrResponseId = responseId ?? record.spanId;
  const sessionId =
    readString(group.sessionStart?.attributes ?? {}, "session.id") ??
    readString(attributes, "gen_ai.conversation.id") ??
    readString(record.resourceAttributes, "session.id");
  const timestamp = record.timestamp ?? matchingTurn?.timestamp ?? null;
  const fallbackRecordId = `${record.spanId ?? "record"}:${index}`;

  return {
    recordId: `otel-log:${record.traceId}:${
      responseId ?? fallbackRecordId
    }`,
    traceId: record.traceId,
    spanId: spanOrResponseId,
    conversationId: sessionId,
    agentName: readString(attributes, "gen_ai.agent.name"),
    repositoryRemoteUrl:
      readString(attributes, "github.copilot.git.repository") ??
      readString(attributes, "copilot_chat.repo.remote_url"),
    branch:
      readString(attributes, "github.copilot.git.branch") ??
      readString(attributes, "copilot_chat.repo.head_branch_name"),
    sessionCreatedAt: group.sessionStart?.timestamp ?? null,
    requestStartedAt: timestamp,
    requestCompletedAt: timestamp,
    modelId: readString(attributes, "gen_ai.request.model"),
    resolvedModel: readString(attributes, "gen_ai.response.model"),
    inputTokens: readNumber(attributes, "gen_ai.usage.input_tokens"),
    outputTokens: readNumber(attributes, "gen_ai.usage.output_tokens"),
    promptTokenDetails: [],
    toolCallRoundCount:
      group.turnRecords.length > 0 ? group.turnRecords.length : 1,
    stopReasons: readStringList(attributes, "gen_ai.response.finish_reasons"),
  };
}

function chooseEarlierLogRecord(
  current: OtelLogRecord | null,
  next: OtelLogRecord,
) {
  if (!current) {
    return next;
  }

  return logRecordTimestamp(next) < logRecordTimestamp(current)
    ? next
    : current;
}

function logRecordTimestamp(record: OtelLogRecord) {
  const timestamp = Date.parse(record.timestamp ?? "");
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function collectOtelSpans(record: unknown): OtelSpan[] {
  if (!isRecord(record)) {
    return [];
  }

  if (Array.isArray(record.resourceSpans)) {
    return record.resourceSpans.flatMap((resourceSpan) =>
      collectResourceSpans(resourceSpan),
    );
  }

  const span = readPlainSpan(record, readSpanResourceAttributes(record));
  return span ? [span] : [];
}

function collectOtelLogRecords(record: unknown): OtelLogRecord[] {
  if (!isRecord(record)) {
    return [];
  }

  if (Array.isArray(record.resourceLogs)) {
    return record.resourceLogs.flatMap((resourceLog) =>
      collectResourceLogs(resourceLog),
    );
  }

  const logRecord = readPlainLogRecord(
    record,
    readLogRecordResourceAttributes(record),
  );
  return logRecord ? [logRecord] : [];
}

function collectResourceLogs(resourceLog: unknown): OtelLogRecord[] {
  if (!isRecord(resourceLog)) {
    return [];
  }

  const resourceAttributes = readAttributes(
    readUnknown(resourceLog, ["resource", "attributes"]),
  );
  const scopeLogs = readUnknown(resourceLog, ["scopeLogs"]);
  if (!Array.isArray(scopeLogs)) {
    return [];
  }

  return scopeLogs.flatMap((scopeLog) => {
    const logRecords = readUnknown(scopeLog, ["logRecords"]);
    if (!Array.isArray(logRecords)) {
      return [];
    }
    return logRecords
      .map((logRecord) => readPlainLogRecord(logRecord, resourceAttributes))
      .filter((logRecord): logRecord is OtelLogRecord => Boolean(logRecord));
  });
}

function readPlainLogRecord(
  value: unknown,
  resourceAttributes: Record<string, unknown>,
): OtelLogRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const attributes = readAttributes(readUnknown(value, ["attributes"]));
  if (!readString(attributes, "event.name")) {
    return null;
  }

  const spanContext = isRecord(value.spanContext) ? value.spanContext : {};
  const traceId =
    readString(spanContext, "traceId") ??
    readStringFromRecord(value, "traceId");
  if (!traceId) {
    return null;
  }

  return {
    traceId,
    spanId:
      readString(spanContext, "spanId") ??
      readStringFromRecord(value, "spanId"),
    timestamp:
      toIsoDate(readUnknown(value, ["timeUnixNano"])) ??
      toIsoDate(readUnknown(value, ["hrTime"])) ??
      toIsoDate(readUnknown(value, ["timestamp"])),
    body:
      readStringFromRecord(value, "_body") ??
      readStringFromRecord(value, "body"),
    attributes,
    resourceAttributes,
  };
}

function collectResourceSpans(resourceSpan: unknown): OtelSpan[] {
  if (!isRecord(resourceSpan)) {
    return [];
  }

  const resourceAttributes = readAttributes(
    readUnknown(resourceSpan, ["resource", "attributes"]),
  );
  const scopeSpans = readUnknown(resourceSpan, ["scopeSpans"]);
  if (!Array.isArray(scopeSpans)) {
    return [];
  }

  return scopeSpans.flatMap((scopeSpan) => {
    const spans = readUnknown(scopeSpan, ["spans"]);
    if (!Array.isArray(spans)) {
      return [];
    }
    return spans
      .map((span) => readPlainSpan(span, resourceAttributes))
      .filter((span): span is OtelSpan => Boolean(span));
  });
}

function readPlainSpan(
  value: unknown,
  resourceAttributes: Record<string, unknown>,
): OtelSpan | null {
  if (!isRecord(value)) {
    return null;
  }

  const traceId = readStringFromRecord(value, "traceId");
  const name = readStringFromRecord(value, "name");
  if (!traceId || !name) {
    return null;
  }

  return {
    traceId,
    spanId:
      readStringFromRecord(value, "spanId") ??
      readStringFromRecord(value, "id"),
    parentSpanId:
      readStringFromRecord(value, "parentSpanId") ??
      readStringFromRecord(value, "parentId"),
    name,
    startTime:
      toIsoDate(readUnknown(value, ["startTimeUnixNano"])) ??
      toIsoDate(readUnknown(value, ["startTime"])) ??
      toIsoDate(readUnknown(value, ["startHrTime"])) ??
      toIsoDate(readUnknown(value, ["timestamp"])),
    endTime:
      toIsoDate(readUnknown(value, ["endTimeUnixNano"])) ??
      toIsoDate(readUnknown(value, ["endTime"])) ??
      toIsoDate(readUnknown(value, ["endHrTime"])),
    attributes: readAttributes(readUnknown(value, ["attributes"])),
    resourceAttributes,
  };
}

function readSpanResourceAttributes(value: Record<string, unknown>) {
  return mergeAttributes(
    readAttributes(readUnknown(value, ["resource", "attributes"])),
    readAttributes(readUnknown(value, ["resource", "_rawAttributes"])),
    readAttributes(readUnknown(value, ["resourceAttributes"])),
  );
}

function readLogRecordResourceAttributes(value: Record<string, unknown>) {
  return mergeAttributes(
    readAttributes(readUnknown(value, ["resource", "attributes"])),
    readAttributes(readUnknown(value, ["resource", "_rawAttributes"])),
    readAttributes(readUnknown(value, ["resourceAttributes"])),
  );
}

function readAttributes(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .map((entry) => {
          if (Array.isArray(entry) && entry.length >= 2) {
            return [String(entry[0]), entry[1]] as const;
          }
          if (!isRecord(entry)) {
            return null;
          }
          return [
            readStringFromRecord(entry, "key"),
            readOtelValue(readUnknown(entry, ["value"])),
          ] as const;
        })
        .filter((entry): entry is readonly [string, unknown] =>
          Boolean(entry?.[0]),
        ),
    );
  }

  if (isRecord(value)) {
    return value;
  }

  return {};
}

function readOtelValue(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  if ("stringValue" in value) {
    return value.stringValue;
  }
  if ("intValue" in value) {
    return toNumber(value.intValue);
  }
  if ("doubleValue" in value) {
    return toNumber(value.doubleValue);
  }
  if ("boolValue" in value) {
    return value.boolValue;
  }
  if (isRecord(value.arrayValue)) {
    const values = value.arrayValue.values;
    return Array.isArray(values) ? values.map(readOtelValue) : [];
  }
  if (isRecord(value.kvlistValue)) {
    return readAttributes(value.kvlistValue.values);
  }

  return value;
}

function belongsToWorkspace(
  request: ParsedOtelRequest,
  workspaceContext: WorkspaceContext,
  sessionMatch: OtelSessionLookupResult | null,
) {
  if (!workspaceContext.repositoryRemoteUrl) {
    return true;
  }

  if (!request.repositoryRemoteUrl) {
    if (hasStrongSessionMatch(request, sessionMatch)) {
      logDebug("Accepted OTel request without repository metadata by matched chat session", {
        traceId: request.traceId,
        conversationId: request.conversationId,
        sessionId: sessionMatch.sessionId,
      });
      return true;
    }

    logDebug("Ignored OTel request without repository metadata", {
      traceId: request.traceId,
      conversationId: request.conversationId,
    });
    return false;
  }

  return (
    normalizeRepositoryRemoteUrl(request.repositoryRemoteUrl) ===
    normalizeRepositoryRemoteUrl(workspaceContext.repositoryRemoteUrl)
  );
}

function hasStrongSessionMatch(
  request: ParsedOtelRequest,
  sessionMatch: OtelSessionLookupResult | null,
): sessionMatch is OtelSessionLookupResult {
  return Boolean(
    request.conversationId &&
      sessionMatch?.sessionId &&
      request.conversationId === sessionMatch.sessionId,
  );
}

export function normalizeRepositoryRemoteUrl(value: string) {
  const trimmed = value.trim();
  const scpLike = /^[a-z][a-z0-9+.-]*:\/\//iu.test(trimmed)
    ? null
    : trimmed.match(/^(?:[^@\s]+@)?([^:\s]+):(.+)$/u);
  const urlLike = scpLike ? `https://${scpLike[1]}/${scpLike[2]}` : trimmed;

  try {
    const url = new URL(urlLike);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname
      .replace(/\/+$/u, "")
      .replace(/\.git$/iu, "");
    const azureSshPath = pathname.match(/^\/v3\/([^/]+)\/([^/]+)\/([^/]+)$/u);
    if (hostname === "ssh.dev.azure.com" && azureSshPath) {
      const [, org, project, repo] = azureSshPath;
      return `https://dev.azure.com/${org}/${project}/_git/${repo}`.toLowerCase();
    }

    const port = url.port ? `:${url.port}` : "";
    return `${url.protocol}//${hostname}${port}${pathname}`.toLowerCase();
  } catch {
    return urlLike
      .replace(/\/+$/u, "")
      .replace(/\.git$/iu, "")
      .toLowerCase();
  }
}

function buildOtelSessionTitle(
  request: ParsedOtelRequest,
  workspaceContext: WorkspaceContext,
) {
  return (
    [
      getRepositoryDisplayName(workspaceContext),
      getTaskDisplayName(workspaceContext),
      getModelDisplayName(request.modelId ?? request.resolvedModel),
    ]
      .filter((part): part is string => Boolean(part))
      .join(" - ") ||
    normalizeAgentName(request.agentName) ||
    "Copilot Chat"
  );
}

function getRepositoryDisplayName(workspaceContext: WorkspaceContext) {
  return (
    basename(workspaceContext.repositoryRoot) ??
    getRepositoryNameFromRemote(workspaceContext.repositoryRemoteUrl) ??
    workspaceContext.workspaceName ??
    basename(workspaceContext.workspacePath)
  );
}

function getTaskDisplayName(workspaceContext: WorkspaceContext) {
  return (
    workspaceContext.selectedTask ??
    workspaceContext.defaultTask ??
    workspaceContext.branch
  );
}

function getModelDisplayName(modelId: string | null) {
  if (!modelId) {
    return null;
  }

  const modelName = basename(modelId) ?? modelId;
  return modelName.replace(/-\d{4}-\d{2}-\d{2}$/u, "");
}

function normalizeAgentName(agentName: string | null) {
  if (!agentName) {
    return null;
  }

  return agentName.replace(/\s+OTel$/iu, "").trim() || null;
}

function getRepositoryNameFromRemote(remoteUrl: string | null) {
  if (!remoteUrl) {
    return null;
  }

  return basename(remoteUrl.replace(/\.git$/iu, ""));
}

function basename(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\\/g, "/").replace(/\/+$/g, "");
  return normalized.split("/").filter(Boolean).at(-1) ?? null;
}

function isInvokeAgentSpan(span: OtelSpan) {
  return (
    readString(span.attributes, "gen_ai.operation.name") === "invoke_agent" ||
    span.name.toLowerCase().startsWith("invoke_agent")
  );
}

function isChatSpan(span: OtelSpan) {
  return (
    readString(span.attributes, "gen_ai.operation.name") === "chat" ||
    span.name.toLowerCase().startsWith("chat ")
  );
}

function choosePreferredSpan(current: OtelSpan | null, next: OtelSpan) {
  if (!current) {
    return next;
  }

  const currentScore = spanCompletenessScore(current);
  const nextScore = spanCompletenessScore(next);
  return nextScore > currentScore ? next : current;
}

function spanCompletenessScore(span: OtelSpan) {
  return [
    readNumber(span.attributes, "gen_ai.usage.input_tokens") === null ? 0 : 20,
    readNumber(span.attributes, "gen_ai.usage.output_tokens") === null ? 0 : 20,
    span.endTime ? 10 : 0,
    readString(span.attributes, "gen_ai.request.model") ? 5 : 0,
  ].reduce((total, value) => total + value, 0);
}

function sumSpanNumbers(spans: OtelSpan[], key: string) {
  let found = false;
  const total = spans.reduce((sum, span) => {
    const value = readNumber(span.attributes, key);
    if (value === null) {
      return sum;
    }
    found = true;
    return sum + value;
  }, 0);

  return found ? total : null;
}

function firstSpanString(spans: OtelSpan[], key: string) {
  for (const span of spans) {
    const value = readString(span.attributes, key);
    if (value) {
      return value;
    }
  }

  return null;
}

function collectStopReasons(spans: OtelSpan[]) {
  return [
    ...new Set(
      spans.flatMap((span) =>
        readStringList(span.attributes, "gen_ai.response.finish_reasons"),
      ),
    ),
  ];
}

function mergeAttributes(...sources: Record<string, unknown>[]) {
  return Object.assign({}, ...sources);
}

function dedupeChatRequests(
  requests: CopilotChatRequest[],
): CopilotChatRequest[] {
  const deduped: CopilotChatRequest[] = [];
  for (const request of requests) {
    const previousIndex = deduped.findIndex((candidate) =>
      areSameCapturedRequest(candidate, request),
    );
    if (previousIndex === -1) {
      deduped.push(request);
      continue;
    }

    deduped[previousIndex] = mergeRicherRequest(
      deduped[previousIndex],
      request,
    );
  }

  return deduped;
}

function areSameCapturedRequest(
  current: CopilotChatRequest,
  next: CopilotChatRequest,
) {
  if (current.requestRecordId === next.requestRecordId) {
    return true;
  }

  if (current.requestId !== next.requestId || current.requestId === null) {
    return false;
  }

  const hasMixedSignals =
    current.requestRecordId.startsWith("otel:") !==
    next.requestRecordId.startsWith("otel:");
  if (!hasMixedSignals) {
    return false;
  }

  if (
    current.responseId !== null &&
    next.responseId !== null &&
    current.responseId === next.responseId
  ) {
    return true;
  }

  return (
    Math.abs(requestTimestamp(current) - requestTimestamp(next)) <= 5_000 &&
    (current.sessionId === next.sessionId ||
      current.sessionId === current.requestId ||
      next.sessionId === next.requestId)
  );
}

function mergeRicherRequest(
  current: CopilotChatRequest,
  next: CopilotChatRequest,
): CopilotChatRequest {
  const preferred =
    requestCompletenessScore(next) > requestCompletenessScore(current)
      ? next
      : current;
  const fallback = preferred === next ? current : next;

  return {
    ...preferred,
    requestRecordId: preferred.requestRecordId,
    requestId: preferred.requestId ?? fallback.requestId,
    responseId: preferred.responseId ?? fallback.responseId,
    sessionTitle: preferred.sessionTitle ?? fallback.sessionTitle,
    sessionCreatedAt: preferred.sessionCreatedAt ?? fallback.sessionCreatedAt,
    requestStartedAt: preferred.requestStartedAt ?? fallback.requestStartedAt,
    requestCompletedAt:
      preferred.requestCompletedAt ?? fallback.requestCompletedAt,
    modelId: preferred.modelId ?? fallback.modelId,
    resolvedModel: preferred.resolvedModel ?? fallback.resolvedModel,
    inputTokens: preferred.inputTokens ?? fallback.inputTokens,
    outputTokens: preferred.outputTokens ?? fallback.outputTokens,
    totalTokens: preferred.totalTokens ?? fallback.totalTokens,
    tokenSource:
      preferred.tokenSource === "copilot-otel"
        ? preferred.tokenSource
        : fallback.tokenSource === "copilot-otel"
          ? fallback.tokenSource
          : preferred.tokenSource,
    promptTokenDetails:
      preferred.promptTokenDetails.length > 0
        ? preferred.promptTokenDetails
        : fallback.promptTokenDetails,
    toolCallRoundCount: Math.max(
      preferred.toolCallRoundCount,
      fallback.toolCallRoundCount,
    ),
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
    Date.parse(
      request.requestCompletedAt ??
        request.requestStartedAt ??
        request.capturedAt,
    ) / 1_000_000_000_000,
  ].reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
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

function summarizeTokenCapture(
  inputTokens: number | null,
  outputTokens: number | null,
): Pick<CopilotChatRequest, "totalTokens" | "tokenSource"> {
  if (inputTokens === null && outputTokens === null) {
    return {
      totalTokens: null,
      tokenSource: "missing-in-copilot-otel",
    };
  }

  if (inputTokens === null || outputTokens === null) {
    return {
      totalTokens: null,
      tokenSource: "partial-in-copilot-otel",
    };
  }

  return {
    totalTokens: inputTokens + outputTokens,
    tokenSource: "copilot-otel",
  };
}

function earliestTimestamp(values: (string | null)[]) {
  const timestamp = values.reduce((earliest, value) => {
    const candidate = timestampOrNull(value);
    return candidate === null ? earliest : Math.min(earliest, candidate);
  }, Number.POSITIVE_INFINITY);

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function latestTimestamp(values: (string | null)[]) {
  const timestamp = values.reduce((latest, value) => {
    const candidate = timestampOrNull(value);
    return candidate === null ? latest : Math.max(latest, candidate);
  }, 0);

  return timestamp === 0 ? null : new Date(timestamp).toISOString();
}

function timestampOrNull(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

async function updateConfigurationValue<T>(
  config: vscode.WorkspaceConfiguration,
  key: string,
  value: T,
): Promise<boolean> {
  const inspected = config.inspect<T>(key);
  if (
    Object.is(config.get<T>(key), value) ||
    Object.is(inspected?.globalValue, value)
  ) {
    return false;
  }

  lastCopilotOtelConfigurationWriteAt = Date.now();
  await config.update(key, value, vscode.ConfigurationTarget.Global);
  return true;
}

function safeJsonParse(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    logDebug("Ignored invalid OTel JSON line");
    return null;
  }
}

function readString(
  source: Record<string, unknown>,
  key: string,
): string | null {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readStringFromRecord(
  source: Record<string, unknown>,
  key: string,
): string | null {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readStringList(source: Record<string, unknown>, key: string) {
  const value = source[key];
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is string => typeof entry === "string" && entry.length > 0,
    );
  }
  if (typeof value === "string" && value.length > 0) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter(
            (entry): entry is string =>
              typeof entry === "string" && entry.length > 0,
          )
        : [value];
    } catch {
      return [value];
    }
  }

  return [];
}

function readNumber(
  source: Record<string, unknown>,
  key: string,
): number | null {
  return toNumber(source[key]);
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.length > 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

function toIsoDate(value: unknown): string | null {
  if (Array.isArray(value) && value.length >= 2) {
    const seconds = toNumber(value[0]);
    const nanos = toNumber(value[1]);
    if (seconds !== null && nanos !== null) {
      return new Date(
        seconds * 1000 + Math.round(nanos / 1_000_000),
      ).toISOString();
    }
  }
  if (typeof value === "bigint") {
    return new Date(Number(value / 1_000_000n)).toISOString();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 10_000_000_000_000) {
      return new Date(Math.round(value / 1_000_000)).toISOString();
    }
    return new Date(value).toISOString();
  }
  if (typeof value === "string" && value.length > 0) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      if (numeric > 10_000_000_000_000) {
        return new Date(Math.round(numeric / 1_000_000)).toISOString();
      }
      return new Date(numeric).toISOString();
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
