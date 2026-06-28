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
  traceId: string;
  spanId: string | null;
  conversationId: string | null;
  agentName: string | null;
  repositoryRemoteUrl: string | null;
  branch: string | null;
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

export type RequestTaskResolver = (
  request: Pick<
    ParsedOtelRequest,
    "traceId" | "conversationId" | "requestStartedAt" | "requestCompletedAt"
  >,
) => RequestTaskResolution | null | undefined;

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

  if (!config.configureCopilotOtel) {
    logInfo("Skipping Copilot OTel settings configuration", {
      otelFilePath,
    });
    return otelFilePath;
  }

  const copilotConfig = vscode.workspace.getConfiguration(
    "github.copilot.chat.otel",
  );
  await updateConfigurationValue(copilotConfig, "enabled", true);
  await updateConfigurationValue(copilotConfig, "exporterType", "file");
  await updateConfigurationValue(copilotConfig, "outfile", otelFilePath);
  await updateConfigurationValue(copilotConfig, "captureContent", false);
  logInfo("Copilot OTel file exporter configured", {
    otelFilePath,
    captureContent: false,
  });
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
  const spans = text
    .split(/\r?\n/)
    .filter(Boolean)
    .flatMap((line) => collectOtelSpans(safeJsonParse(line)));
  const parsedRequests = parseOtelRequests(spans, workspaceContext);
  const requests = parsedRequests.map((request) => {
    const requestWorkspaceContext = {
      ...workspaceContext,
      branch: request.branch ?? workspaceContext.branch,
      repositoryRemoteUrl:
        request.repositoryRemoteUrl ?? workspaceContext.repositoryRemoteUrl,
      ...(resolveTaskForRequest?.(request) ?? {}),
    };
    const inputTokens = request.inputTokens;
    const outputTokens = request.outputTokens;
    const totalTokens =
      inputTokens === null && outputTokens === null
        ? null
        : (inputTokens ?? 0) + (outputTokens ?? 0);
    const tokenSource: CopilotChatRequest["tokenSource"] =
      totalTokens === null ? "missing-in-copilot-otel" : "copilot-otel";

    return {
      ...requestWorkspaceContext,
      requestRecordId: `otel:${request.traceId}`,
      requestId: request.traceId,
      responseId: request.spanId,
      sessionId: request.conversationId ?? request.traceId,
      sessionTitle: request.agentName
        ? `${request.agentName} OTel`
        : "Copilot OTel",
      sessionCreatedAt: null,
      requestStartedAt: request.requestStartedAt,
      requestCompletedAt: request.requestCompletedAt,
      modelId: request.modelId,
      resolvedModel: request.resolvedModel,
      modelName: null,
      modelVendor: null,
      modelFamily: null,
      inputTokens,
      outputTokens,
      totalTokens,
      tokenSource,
      promptTokenDetails: request.promptTokenDetails,
      toolCallRoundCount: request.toolCallRoundCount,
      stopReasons: request.stopReasons,
      capturedAt: new Date().toISOString(),
    };
  });
  const dedupedRequests = dedupeChatRequests(requests);
  logInfo("Finished reading Copilot OTel requests", {
    spanCount: spans.length,
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

function parseOtelRequests(
  spans: OtelSpan[],
  workspaceContext: WorkspaceContext,
): ParsedOtelRequest[] {
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
    .filter((request): request is ParsedOtelRequest => Boolean(request))
    .filter((request) => belongsToWorkspace(request, workspaceContext));
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
    readAttributes(readUnknown(value, ["resourceAttributes"])),
  );
}

function readAttributes(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .filter(isRecord)
        .map((entry) => [
          readStringFromRecord(entry, "key"),
          readOtelValue(readUnknown(entry, ["value"])),
        ])
        .filter(([key]) => Boolean(key)),
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
) {
  if (!request.repositoryRemoteUrl || !workspaceContext.repositoryRemoteUrl) {
    return true;
  }

  return (
    normalizeRemoteUrl(request.repositoryRemoteUrl) ===
    normalizeRemoteUrl(workspaceContext.repositoryRemoteUrl)
  );
}

function normalizeRemoteUrl(value: string) {
  return value
    .trim()
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/i, "")
    .toLowerCase();
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
  return requestCompletenessScore(next) > requestCompletenessScore(current)
    ? next
    : current;
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

function updateConfigurationValue<T>(
  config: vscode.WorkspaceConfiguration,
  key: string,
  value: T,
) {
  if (config.get<T>(key) === value) {
    return Promise.resolve();
  }

  return config.update(key, value, vscode.ConfigurationTarget.Global);
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
