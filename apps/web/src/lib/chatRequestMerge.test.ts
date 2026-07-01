import type { CopilotChatRequest } from "@copilot-tracker/shared";
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  dedupeChatRequests,
  normalizeTokenTotals,
  prepareChatRequestsForUpsert,
} from "./chatRequestMerge";

void test("normalizeTokenTotals derives complete, partial, and missing token states", () => {
  assert.deepEqual(
    pickTokenFields(
      normalizeTokenTotals(
        createRequest({
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 999,
          tokenSource: "missing-in-copilot-otel",
        }),
      ),
    ),
    {
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
      tokenSource: "copilot-otel",
    },
  );
  assert.deepEqual(
    pickTokenFields(normalizeTokenTotals(createRequest({ outputTokens: null }))),
    {
      inputTokens: 10,
      outputTokens: null,
      totalTokens: null,
      tokenSource: "partial-in-copilot-otel",
    },
  );
  assert.deepEqual(
    pickTokenFields(
      normalizeTokenTotals(
        createRequest({ inputTokens: null, outputTokens: null }),
      ),
    ),
    {
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
      tokenSource: "missing-in-copilot-otel",
    },
  );
});

void test("dedupeChatRequests keeps the richer duplicate while filling fallback fields", () => {
  const [request] = dedupeChatRequests([
    createRequest({
      inputTokens: 10,
      modelId: null,
      outputTokens: null,
      promptTokenDetails: [{ category: "context", label: "repo", percentageOfPrompt: 50 }],
      requestCompletedAt: null,
      requestId: "fallback-request",
      sessionTitle: "Fallback title",
      stopReasons: ["stop"],
      totalTokens: null,
    }),
    createRequest({
      inputTokens: 10,
      modelId: "gpt-5-nano",
      outputTokens: 20,
      promptTokenDetails: [],
      requestCompletedAt: "2026-07-01T00:01:00.000Z",
      requestId: null,
      sessionTitle: null,
      stopReasons: [],
      totalTokens: 30,
    }),
  ]);

  assert.equal(request?.modelId, "gpt-5-nano");
  assert.equal(request?.requestId, "fallback-request");
  assert.equal(request?.sessionTitle, "Fallback title");
  assert.deepEqual(request?.promptTokenDetails, [
    { category: "context", label: "repo", percentageOfPrompt: 50 },
  ]);
  assert.deepEqual(request?.stopReasons, ["stop"]);
  assert.equal(request?.totalTokens, 30);
});

void test("prepareChatRequestsForUpsert normalizes tokens before deduping", () => {
  const [request] = prepareChatRequestsForUpsert([
    createRequest({
      inputTokens: 5,
      outputTokens: 7,
      requestRecordId: "record-1",
      totalTokens: null,
      tokenSource: "missing-in-copilot-otel",
    }),
    createRequest({
      inputTokens: null,
      outputTokens: null,
      requestRecordId: "record-1",
    }),
  ]);

  assert.equal(request?.totalTokens, 12);
  assert.equal(request?.tokenSource, "copilot-otel");
});

function pickTokenFields(request: CopilotChatRequest) {
  return {
    inputTokens: request.inputTokens,
    outputTokens: request.outputTokens,
    totalTokens: request.totalTokens,
    tokenSource: request.tokenSource,
  };
}

function createRequest(
  overrides: Partial<CopilotChatRequest> = {},
): CopilotChatRequest {
  return {
    branch: "feature/123-login",
    capturedAt: "2026-07-01T00:01:31.000Z",
    defaultTask: "123",
    inputTokens: 10,
    modelFamily: "gpt-5",
    modelId: "gpt-5-nano",
    modelName: "gpt-5-nano",
    modelVendor: "openai",
    outputTokens: 20,
    promptTokenDetails: [],
    repositoryRemoteUrl: "https://example.com/org/repo.git",
    repositoryRoot: "/tmp/copilot-tracker",
    requestCompletedAt: "2026-07-01T00:01:30.000Z",
    requestId: "request-1",
    requestRecordId: "record-1",
    requestStartedAt: "2026-07-01T00:01:00.000Z",
    resolvedModel: "gpt-5-nano",
    responseId: "response-1",
    selectedTask: "123",
    sessionCreatedAt: "2026-07-01T00:00:00.000Z",
    sessionId: "session-1",
    sessionTitle: "Implement login",
    stopReasons: ["stop"],
    tokenSource: "copilot-otel",
    toolCallRoundCount: 1,
    totalTokens: 30,
    workspaceId: "workspace-1",
    workspaceName: "copilot-tracker",
    workspacePath: "/tmp/copilot-tracker",
    ...overrides,
  };
}
