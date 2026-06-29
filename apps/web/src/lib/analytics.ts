import type { CopilotChatRequest } from "@copilot-tracker/shared";

import { estimateRequestsCost } from "./pricing";
import type { TrackerDatabase } from "./store";

export interface SummaryMetrics {
  requestCount: number;
  missingTokenCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageTokensPerRequest: number;
  estimatedUsd: number;
  lastRequestAt: string | null;
}

export interface LeaderboardRow extends SummaryMetrics {
  userLogin: string;
  userId: string | null;
  githubLogin: string | null;
  rank: number;
}

export interface TaskSummaryRow extends SummaryMetrics {
  task: string;
  repositoryName: string;
  repositoryRoot: string | null;
  branch: string | null;
}

export interface DeveloperTaskSummaryRow extends SummaryMetrics {
  userLogin: string;
  userId: string | null;
  githubLogin: string | null;
  task: string;
}

export interface ModelSummaryRow extends SummaryMetrics {
  model: string;
}

export function isMeaningfulChatRequest(request: CopilotChatRequest): boolean {
  const hasRequestMetadata = [
    request.requestId,
    request.responseId,
    request.modelId,
    request.resolvedModel,
    request.modelName,
  ].some((value) => value !== null && value.length > 0);
  const hasTokenMetadata =
    request.inputTokens !== null ||
    request.outputTokens !== null ||
    request.totalTokens !== null;

  return hasRequestMetadata || hasTokenMetadata;
}

export function filterMeaningfulChatRequests<T extends CopilotChatRequest>(
  requests: T[],
): T[] {
  return requests.filter((request) => isMeaningfulChatRequest(request));
}

export function summarizeRequests(
  sourceRequests: CopilotChatRequest[],
): SummaryMetrics {
  const requests = filterMeaningfulChatRequests(sourceRequests);
  const requestCount = requests.length;
  const missingTokenCount = requests.filter(
    (request) => request.totalTokens === null,
  ).length;
  const inputTokens = requests.reduce(
    (total, request) => total + (request.inputTokens ?? 0),
    0,
  );
  const outputTokens = requests.reduce(
    (total, request) => total + (request.outputTokens ?? 0),
    0,
  );
  const totalTokens = requests.reduce(
    (total, request) => total + (request.totalTokens ?? 0),
    0,
  );
  const cost = estimateRequestsCost(requests);
  return {
    requestCount,
    missingTokenCount,
    inputTokens,
    outputTokens,
    totalTokens,
    averageTokensPerRequest:
      requestCount === 0 ? 0 : Math.round(totalTokens / requestCount),
    estimatedUsd: cost.estimatedUsd,
    lastRequestAt: getLastRequestAt(requests),
  };
}

export function publicLeaderboard(database: TrackerDatabase): LeaderboardRow[] {
  const grouped = new Map<
    string,
    (CopilotChatRequest & {
      userLogin: string | null;
      userId: string | null;
      githubLogin: string | null;
    })[]
  >();
  for (const request of filterMeaningfulChatRequests(database.chatRequests)) {
    const key = request.userId ?? `login:${request.userLogin ?? "unknown"}`;
    grouped.set(key, [...(grouped.get(key) ?? []), request]);
  }

  return [...grouped.entries()]
    .map(([, requests]) => {
      const user = requests[0]?.userId
        ? database.users.find((entry) => entry.userId === requests[0]?.userId)
        : null;
      return {
        userLogin: user?.login ?? requests[0]?.userLogin ?? "unknown",
        userId: requests[0]?.userId ?? null,
        githubLogin: user?.githubLogin ?? requests[0]?.githubLogin ?? null,
        ...summarizeRequests(requests),
        rank: 0,
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function taskSummaries(
  sourceRequests: CopilotChatRequest[],
): TaskSummaryRow[] {
  const grouped = new Map<string, CopilotChatRequest[]>();
  const requests = filterMeaningfulChatRequests(sourceRequests);
  for (const request of requests) {
    const key = [
      request.selectedTask ?? "No task",
      request.repositoryRoot ?? "",
      request.branch ?? "",
    ].join("\u0000");
    grouped.set(key, [...(grouped.get(key) ?? []), request]);
  }

  return [...grouped.entries()]
    .map(([key, groupedRequests]) => {
      const [task, repositoryRoot, branch] = key.split("\u0000");
      const firstRequest = groupedRequests[0];
      return {
        task,
        repositoryName: getRepositoryName(firstRequest),
        repositoryRoot: repositoryRoot || null,
        branch: branch || null,
        ...summarizeRequests(groupedRequests),
      };
    })
    .sort(compareByLastRequest);
}

export function developerTaskSummaries(
  sourceRequests: (CopilotChatRequest & {
    userLogin?: string | null;
    userId?: string | null;
    githubLogin?: string | null;
  })[],
): DeveloperTaskSummaryRow[] {
  const requests = filterMeaningfulChatRequests(sourceRequests);
  const grouped = new Map<
    string,
    (CopilotChatRequest & {
      userLogin?: string | null;
      userId?: string | null;
      githubLogin?: string | null;
    })[]
  >();
  for (const request of requests) {
    const key = [
      request.userLogin ?? "unknown",
      request.userId ?? "",
      request.githubLogin ?? "",
      request.selectedTask ?? request.defaultTask ?? "No task",
    ].join("\u0000");
    grouped.set(key, [...(grouped.get(key) ?? []), request]);
  }

  return [...grouped.entries()]
    .map(([key, groupedRequests]) => {
      const [userLogin, userId, githubLogin, task] = key.split("\u0000");
      return {
        userLogin,
        userId: userId || null,
        githubLogin: githubLogin || null,
        task,
        ...summarizeRequests(groupedRequests),
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

export function modelSummaries(
  sourceRequests: CopilotChatRequest[],
): ModelSummaryRow[] {
  const grouped = new Map<string, CopilotChatRequest[]>();
  const requests = filterMeaningfulChatRequests(sourceRequests);
  for (const request of requests) {
    const model =
      request.modelId ??
      request.resolvedModel ??
      request.modelName ??
      "unknown";
    grouped.set(model, [...(grouped.get(model) ?? []), request]);
  }

  return [...grouped.entries()]
    .map(([model, groupedRequests]) => ({
      model,
      ...summarizeRequests(groupedRequests),
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getRequestActivityTimestamp(
  request: Pick<
    CopilotChatRequest,
    "requestCompletedAt" | "requestStartedAt" | "capturedAt"
  >,
) {
  return timestampOrZero(
    request.requestCompletedAt ??
      request.requestStartedAt ??
      request.capturedAt,
  );
}

export function getRepositoryName(
  request:
    | Pick<
        CopilotChatRequest,
        "repositoryRoot" | "workspaceName" | "workspacePath"
      >
    | null
    | undefined,
): string {
  return (
    basename(request?.repositoryRoot) ??
    request?.workspaceName ??
    basename(request?.workspacePath) ??
    "unknown"
  );
}

function basename(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replaceAll("\\", "/").replaceAll(/\/+$/g, "");
  const segments = normalized.split("/");
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (segment) {
      return segment;
    }
  }

  return null;
}

function getLastRequestAt(requests: CopilotChatRequest[]) {
  const timestamp = requests.reduce((latest, request) => {
    const candidate = Date.parse(
      request.requestCompletedAt ??
        request.requestStartedAt ??
        request.capturedAt,
    );
    return Number.isNaN(candidate) ? latest : Math.max(latest, candidate);
  }, 0);

  return timestamp === 0 ? null : new Date(timestamp).toISOString();
}

function compareByLastRequest(
  a: { lastRequestAt: string | null; totalTokens: number },
  b: { lastRequestAt: string | null; totalTokens: number },
) {
  const byLastRequest =
    timestampOrZero(b.lastRequestAt) - timestampOrZero(a.lastRequestAt);
  if (byLastRequest !== 0) {
    return byLastRequest;
  }

  return b.totalTokens - a.totalTokens;
}

function timestampOrZero(value: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
