import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  RequestGridRequest,
  SessionGroup,
} from "./requestSessionsGridModel";

import {
  formatRequestCost,
  formatTokenCaptureLabel,
  getCommonTask,
  getCurrentTask,
  groupRequestsBySession,
  sessionAnchor,
} from "./requestSessionsGridModel";

void test("groupRequestsBySession sorts the focused session first and rows by latest activity", () => {
  const groups = groupRequestsBySession(
    [
      createRequest({
        requestRecordId: "older-focused",
        requestCompletedAt: "2026-07-01T00:01:00.000Z",
        sessionId: "focused-session",
      }),
      createRequest({
        requestRecordId: "newest-other",
        requestCompletedAt: "2026-07-01T00:10:00.000Z",
        sessionId: "newest-session",
      }),
      createRequest({
        requestRecordId: "newer-focused",
        requestCompletedAt: "2026-07-01T00:05:00.000Z",
        sessionId: "focused-session",
      }),
    ],
    "focused-session",
  );

  assert.deepEqual(
    groups.map((group) => group.sessionId),
    ["focused-session", "newest-session"],
  );
  assert.deepEqual(
    groups[0]?.requests.map((request) => request.requestRecordId),
    ["newer-focused", "older-focused"],
  );
});

void test("groupRequestsBySession otherwise sorts sessions by latest activity", () => {
  const groups = groupRequestsBySession(
    [
      createRequest({
        requestRecordId: "old",
        requestCompletedAt: "2026-07-01T00:01:00.000Z",
        sessionId: "old-session",
      }),
      createRequest({
        requestRecordId: "new",
        requestCompletedAt: "2026-07-01T00:10:00.000Z",
        sessionId: "new-session",
      }),
    ],
    null,
  );

  assert.deepEqual(
    groups.map((group) => group.sessionId),
    ["new-session", "old-session"],
  );
});

void test("task helpers honor manual overrides while clear falls back to the detected default task", () => {
  const request = createRequest({
    defaultTask: "branch-123",
    requestRecordId: "request-1",
    selectedTask: "manual-456",
  });

  assert.equal(getCurrentTask(request, {}), "manual-456");
  assert.equal(getCurrentTask(request, { "request-1": "manual-789" }), "manual-789");
  assert.equal(getCurrentTask(request, { "request-1": null }), "branch-123");
});

void test("getCommonTask returns a shared task only when all session requests agree", () => {
  const group: SessionGroup = {
    sessionCreatedAt: "2026-07-01T00:00:00.000Z",
    sessionId: "session-1",
    sessionTitle: "Implement auth",
    requests: [
      createRequest({ requestRecordId: "a", selectedTask: "123" }),
      createRequest({ requestRecordId: "b", selectedTask: "123" }),
    ],
  };

  assert.equal(getCommonTask(group, {}), "123");
  assert.equal(getCommonTask(group, { b: "456" }), "");
  assert.equal(getCommonTask(group, { a: null, b: null }), "123");
});

void test("token and cost labels distinguish complete, partial, missing, and unpriced requests", () => {
  assert.equal(
    formatTokenCaptureLabel(createRequest({ totalTokens: 1234 })),
    "1,234 total",
  );
  assert.equal(
    formatTokenCaptureLabel(
      createRequest({
        outputTokens: null,
        tokenSource: "partial-in-copilot-otel",
        totalTokens: null,
      }),
    ),
    "partial capture",
  );
  assert.equal(
    formatTokenCaptureLabel(
      createRequest({
        inputTokens: null,
        outputTokens: null,
        tokenSource: "missing-in-copilot-otel",
        totalTokens: null,
      }),
    ),
    "missing total",
  );

  assert.equal(formatRequestCost(createRequest({ totalTokens: null })), "missing");
  assert.equal(
    formatRequestCost(
      createRequest({
        modelId: "unknown-model",
        modelName: null,
        resolvedModel: null,
      }),
    ),
    "unpriced",
  );
  assert.match(formatRequestCost(createRequest()), /^\$/);
});

void test("sessionAnchor produces stable DOM-safe ids", () => {
  assert.equal(
    sessionAnchor("session/with spaces:and.symbols"),
    "session-session-with-spaces-and-symbols",
  );
});

function createRequest(
  overrides: Partial<RequestGridRequest> = {},
): RequestGridRequest {
  return {
    branch: "feature/123-login",
    capturedAt: "2026-07-01T00:01:31.000Z",
    defaultTask: "123",
    inputTokens: 1000,
    modelFamily: "gpt-5",
    modelId: "gpt-5-nano",
    modelName: "gpt-5-nano",
    modelVendor: "openai",
    outputTokens: 1000,
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
    totalTokens: 2000,
    workspaceId: "workspace-1",
    workspaceName: "copilot-tracker",
    workspacePath: "/tmp/copilot-tracker",
    ...overrides,
  };
}
