import type { CopilotChatRequest } from "@copilot-tracker/shared";

import {
  formatNumber,
  getRequestActivityTimestamp,
} from "./analytics";
import { estimateRequestsCost, formatCurrency } from "./pricing";

export type RequestGridRequest = CopilotChatRequest & {
  userLogin?: string | null;
  githubLogin?: string | null;
  userId?: string | null;
};

export interface SessionGroup {
  sessionId: string;
  sessionTitle: string | null;
  sessionCreatedAt: string | null;
  requests: RequestGridRequest[];
}

export type TaskOverrideMap = Record<string, string | null>;

export function groupRequestsBySession(
  requests: RequestGridRequest[],
  focusedSessionId: string | null,
): SessionGroup[] {
  const groups = new Map<string, SessionGroup>();
  for (const request of requests) {
    const group = groups.get(request.sessionId) ?? {
      sessionId: request.sessionId,
      sessionTitle: request.sessionTitle,
      sessionCreatedAt: request.sessionCreatedAt,
      requests: [],
    };
    group.requests.push(request);
    group.sessionTitle ??= request.sessionTitle;
    group.sessionCreatedAt ??= request.sessionCreatedAt;
    groups.set(request.sessionId, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      requests: [...group.requests].sort(
        (a, b) => getRequestActivityTimestamp(b) - getRequestActivityTimestamp(a),
      ),
    }))
    .sort((a, b) => {
      if (focusedSessionId) {
        if (a.sessionId === focusedSessionId) {
          return -1;
        }
        if (b.sessionId === focusedSessionId) {
          return 1;
        }
      }

      const aFirstRequest = a.requests[0];
      const bFirstRequest = b.requests[0];
      return (
        (bFirstRequest ? getRequestActivityTimestamp(bFirstRequest) : 0) -
        (aFirstRequest ? getRequestActivityTimestamp(aFirstRequest) : 0)
      );
    });
}

export function getCommonTask(
  group: SessionGroup,
  taskOverrides: TaskOverrideMap,
) {
  const firstRequest = group.requests[0];
  if (!firstRequest) {
    return "";
  }

  const firstTask = getCurrentTask(firstRequest, taskOverrides);
  return group.requests.every(
    (request) => getCurrentTask(request, taskOverrides) === firstTask,
  )
    ? firstTask
    : "";
}

export function getCurrentTask(
  request: RequestGridRequest,
  taskOverrides: TaskOverrideMap,
) {
  if (Object.hasOwn(taskOverrides, request.requestRecordId)) {
    return taskOverrides[request.requestRecordId] ?? request.defaultTask ?? "";
  }

  return request.selectedTask ?? request.defaultTask ?? "";
}

export function formatRequestCost(request: RequestGridRequest) {
  if (request.totalTokens === null) {
    return "missing";
  }

  const cost = estimateRequestsCost([request]);
  if (cost.pricedRequestCount === 0) {
    return "unpriced";
  }

  return formatCurrency(cost.estimatedUsd);
}

export function formatTokenCaptureLabel(request: RequestGridRequest) {
  if (request.totalTokens !== null) {
    return `${formatNumber(request.totalTokens)} total`;
  }

  return request.tokenSource === "partial-in-copilot-otel"
    ? "partial capture"
    : "missing total";
}

export function sessionAnchor(sessionId: string) {
  return `session-${sessionId.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;
}
