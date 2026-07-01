import type { CopilotChatRequest } from "@copilot-tracker/shared";

export function prepareChatRequestsForUpsert(
  requests: CopilotChatRequest[],
): CopilotChatRequest[] {
  return dedupeChatRequests(requests.map((request) => normalizeTokenTotals(request)));
}

export function dedupeChatRequests(
  requests: CopilotChatRequest[],
): CopilotChatRequest[] {
  const uniqueByRecordId = new Map<string, CopilotChatRequest>();
  for (const request of requests) {
    const previous = uniqueByRecordId.get(request.requestRecordId);
    uniqueByRecordId.set(
      request.requestRecordId,
      previous ? chooseRicherChatRequest(previous, request) : request,
    );
  }

  return [...uniqueByRecordId.values()];
}

export function normalizeTokenTotals(
  request: CopilotChatRequest,
): CopilotChatRequest {
  if (request.inputTokens === null && request.outputTokens === null) {
    return {
      ...request,
      totalTokens: null,
      tokenSource: "missing-in-copilot-otel",
    };
  }

  if (request.inputTokens === null || request.outputTokens === null) {
    return {
      ...request,
      totalTokens: null,
      tokenSource: "partial-in-copilot-otel",
    };
  }

  return {
    ...request,
    totalTokens: request.inputTokens + request.outputTokens,
    tokenSource: "copilot-otel",
  };
}

function chooseRicherChatRequest(
  current: CopilotChatRequest,
  next: CopilotChatRequest,
) {
  if (
    chatRequestCompletenessScore(next) > chatRequestCompletenessScore(current)
  ) {
    return mergeChatRequests(next, current);
  }

  return mergeChatRequests(current, next);
}

function mergeChatRequests(
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

function chatRequestCompletenessScore(request: CopilotChatRequest) {
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
