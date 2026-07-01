import assert from "node:assert/strict";
import { test } from "node:test";
import type { CopilotChatRequest } from "@copilot-tracker/shared";

import { estimateRequestsCost, formatCurrency } from "./pricing";

void test("estimateRequestsCost prices known model aliases and AI credits", () => {
  const result = estimateRequestsCost([
    createRequest({
      modelId: "openai/gpt-5-nano",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    }),
  ]);

  assert.equal(result.pricedRequestCount, 1);
  assert.equal(result.unpricedRequestCount, 0);
  assert.equal(result.estimatedUsd, 0.45);
  assert.equal(result.estimatedAiCredits, 45);
});

void test("estimateRequestsCost uses resolved/model display names and counts unpriced requests", () => {
  const result = estimateRequestsCost([
    createRequest({
      modelId: null,
      resolvedModel: "claude-sonnet-4.5-20260101",
      modelName: null,
      inputTokens: 500_000,
      outputTokens: 100_000,
    }),
    createRequest({
      modelId: "unknown-model",
      resolvedModel: null,
      modelName: null,
    }),
  ]);

  assert.equal(result.pricedRequestCount, 1);
  assert.equal(result.unpricedRequestCount, 1);
  assert.equal(result.estimatedUsd, 3);
});

void test("formatCurrency keeps small costs readable", () => {
  assert.equal(formatCurrency(0.0045), "$0.0045");
  assert.equal(formatCurrency(12.345), "$12.35");
});

function createRequest(
  overrides: Partial<CopilotChatRequest> = {},
): CopilotChatRequest {
  return {
    workspaceId: "workspace-1",
    workspacePath: null,
    workspaceName: "copilot-tracker",
    repositoryRoot: null,
    repositoryRemoteUrl: null,
    branch: "main",
    defaultTask: null,
    selectedTask: null,
    requestRecordId: "record-1",
    requestId: null,
    responseId: null,
    sessionId: "session-1",
    sessionTitle: null,
    sessionCreatedAt: null,
    requestStartedAt: null,
    requestCompletedAt: null,
    modelId: "gpt-5-nano",
    resolvedModel: "gpt-5-nano",
    modelName: "gpt-5-nano",
    modelVendor: null,
    modelFamily: null,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    tokenSource: "copilot-otel",
    promptTokenDetails: [],
    toolCallRoundCount: 0,
    stopReasons: [],
    capturedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}
