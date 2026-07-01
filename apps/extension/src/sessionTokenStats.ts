import { estimateRequestsCostUsd } from "./pricing";
import type { CopilotChatRequest } from "./types";

export interface SessionTokenStats {
  sessionId: string;
  sessionTitle: string | null;
  requestCount: number;
  incompleteTokenRequestCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedUsd: number;
}

export function currentSessionTokenStats(
  requests: CopilotChatRequest[],
): SessionTokenStats | null {
  const latestRequest = [...requests]
    .filter((request) => request.totalTokens !== null)
    .sort((a, b) => requestTimestamp(b) - requestTimestamp(a))[0];
  if (!latestRequest) {
    return null;
  }

  const sessionRequests = requests.filter(
    (request) => request.sessionId === latestRequest.sessionId,
  );
  return {
    sessionId: latestRequest.sessionId,
    sessionTitle: latestRequest.sessionTitle,
    requestCount: sessionRequests.length,
    incompleteTokenRequestCount: sessionRequests.filter(
      (request) =>
        request.inputTokens === null ||
        request.outputTokens === null ||
        request.totalTokens === null,
    ).length,
    inputTokens: sessionRequests.reduce(
      (total, request) => total + (request.inputTokens ?? 0),
      0,
    ),
    outputTokens: sessionRequests.reduce(
      (total, request) => total + (request.outputTokens ?? 0),
      0,
    ),
    totalTokens: sessionRequests.reduce(
      (total, request) => total + (request.totalTokens ?? 0),
      0,
    ),
    estimatedUsd: estimateRequestsCostUsd(sessionRequests),
  };
}

function requestTimestamp(request: CopilotChatRequest) {
  return timestampOrZero(
    request.requestCompletedAt ?? request.requestStartedAt ?? request.capturedAt,
  );
}

function timestampOrZero(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
