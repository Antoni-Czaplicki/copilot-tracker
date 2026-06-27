import { CopilotChatRequest } from "@copilot-tracker/shared";

import { TrackerDatabase } from "./store";

export interface SummaryMetrics {
  requestCount: number;
  missingTokenCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageTokensPerRequest: number;
}

export interface LeaderboardRow extends SummaryMetrics {
  githubLogin: string;
  githubId: number | null;
  rank: number;
}

export interface TaskSummaryRow extends SummaryMetrics {
  task: string;
  repositoryRoot: string | null;
  branch: string | null;
}

export interface DeveloperTaskSummaryRow extends SummaryMetrics {
  githubLogin: string;
  githubId: number | null;
  task: string;
}

export interface ModelSummaryRow extends SummaryMetrics {
  model: string;
}

export function summarizeRequests(
  requests: CopilotChatRequest[],
): SummaryMetrics {
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
  return {
    requestCount,
    missingTokenCount,
    inputTokens,
    outputTokens,
    totalTokens,
    averageTokensPerRequest:
      requestCount === 0 ? 0 : Math.round(totalTokens / requestCount),
  };
}

export function publicLeaderboard(database: TrackerDatabase): LeaderboardRow[] {
  const grouped = new Map<
    string,
    Array<
      CopilotChatRequest & {
        githubLogin: string | null;
        githubId: number | null;
      }
    >
  >();
  for (const request of database.chatRequests) {
    const login = request.githubLogin ?? "unknown";
    grouped.set(login, [...(grouped.get(login) ?? []), request]);
  }

  return [...grouped.entries()]
    .map(([githubLogin, requests]) => ({
      githubLogin,
      githubId: requests[0]?.githubId ?? null,
      ...summarizeRequests(requests),
      rank: 0,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function taskSummaries(
  requests: CopilotChatRequest[],
): TaskSummaryRow[] {
  const grouped = new Map<string, CopilotChatRequest[]>();
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
      return {
        task,
        repositoryRoot: repositoryRoot || null,
        branch: branch || null,
        ...summarizeRequests(groupedRequests),
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

export function developerTaskSummaries(
  requests: Array<
    CopilotChatRequest & {
      githubLogin?: string | null;
      githubId?: number | null;
    }
  >,
): DeveloperTaskSummaryRow[] {
  const grouped = new Map<
    string,
    Array<
      CopilotChatRequest & {
        githubLogin?: string | null;
        githubId?: number | null;
      }
    >
  >();
  for (const request of requests) {
    const key = [
      request.githubLogin ?? "unknown",
      request.githubId ?? "",
      request.selectedTask ?? request.defaultTask ?? "No task",
    ].join("\u0000");
    grouped.set(key, [...(grouped.get(key) ?? []), request]);
  }

  return [...grouped.entries()]
    .map(([key, groupedRequests]) => {
      const [githubLogin, githubId, task] = key.split("\u0000");
      return {
        githubLogin,
        githubId: githubId ? Number(githubId) : null,
        task,
        ...summarizeRequests(groupedRequests),
      };
    })
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

export function modelSummaries(
  requests: CopilotChatRequest[],
): ModelSummaryRow[] {
  const grouped = new Map<string, CopilotChatRequest[]>();
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
