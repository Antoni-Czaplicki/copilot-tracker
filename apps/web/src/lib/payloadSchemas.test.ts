import assert from "node:assert/strict";
import { test } from "node:test";

import {
  chatRequestBatchSchema,
  copilotChatRequestSchema,
  taskAssignmentSchema,
} from "./payloadSchemas";

const maxPostgresInteger = 2_147_483_647;

void test("copilotChatRequestSchema accepts PostgreSQL integer token bounds", () => {
  const result = copilotChatRequestSchema.safeParse(
    createChatRequest({
      inputTokens: maxPostgresInteger,
      outputTokens: maxPostgresInteger,
      totalTokens: maxPostgresInteger,
    }),
  );

  assert.equal(result.success, true);
});

void test("copilotChatRequestSchema rejects token counts above PostgreSQL integer bounds", () => {
  for (const tokenField of [
    "inputTokens",
    "outputTokens",
    "totalTokens",
  ] as const) {
    const result = copilotChatRequestSchema.safeParse(
      createChatRequest({ [tokenField]: maxPostgresInteger + 1 }),
    );

    assert.equal(result.success, false, tokenField);
  }
});

void test("chatRequestBatchSchema caps batches at 500 requests", () => {
  assert.equal(
    chatRequestBatchSchema.safeParse({
      requests: Array.from({ length: 500 }, (_, index) =>
        createChatRequest({ requestRecordId: `record-${index}` }),
      ),
    }).success,
    true,
  );
  assert.equal(
    chatRequestBatchSchema.safeParse({
      requests: Array.from({ length: 501 }, (_, index) =>
        createChatRequest({ requestRecordId: `record-${index}` }),
      ),
    }).success,
    false,
  );
});

void test("taskAssignmentSchema trims task values and rejects empty assignments", () => {
  const result = taskAssignmentSchema.safeParse({
    requestRecordIds: ["record-1"],
    selectedTask: "  12345  ",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.selectedTask, "12345");
  assert.equal(
    taskAssignmentSchema.safeParse({
      requestRecordIds: ["record-1"],
      selectedTask: "   ",
    }).success,
    false,
  );
});

void test("taskAssignmentSchema accepts null selectedTask to clear assignments", () => {
  const result = taskAssignmentSchema.safeParse({
    requestRecordIds: ["record-1"],
    selectedTask: null,
  });

  assert.equal(result.success, true);
  assert.equal(result.data.selectedTask, null);
});

function createChatRequest(
  overrides: Partial<ReturnType<typeof baseChatRequest>> = {},
) {
  return {
    ...baseChatRequest(),
    ...overrides,
  };
}

function baseChatRequest() {
  return {
    workspaceId: "workspace-1",
    workspacePath: "/tmp/copilot-tracker",
    workspaceName: "copilot-tracker",
    repositoryRoot: "/tmp/copilot-tracker",
    repositoryRemoteUrl: "https://example.com/org/repo.git",
    branch: "feature/123-login",
    defaultTask: "123",
    selectedTask: "123",
    requestRecordId: "record-1",
    requestId: "request-1",
    responseId: "response-1",
    sessionId: "session-1",
    sessionTitle: "Implement login",
    sessionCreatedAt: "2026-07-01T00:00:00.000Z",
    requestStartedAt: "2026-07-01T00:01:00.000Z",
    requestCompletedAt: "2026-07-01T00:01:30.000Z",
    modelId: "gpt-5-nano",
    resolvedModel: "gpt-5-nano",
    modelName: "gpt-5-nano",
    modelVendor: "openai",
    modelFamily: "gpt-5",
    inputTokens: 10,
    outputTokens: 20,
    totalTokens: 30,
    tokenSource: "copilot-otel",
    promptTokenDetails: [],
    toolCallRoundCount: 1,
    stopReasons: ["stop"],
    capturedAt: "2026-07-01T00:01:31.000Z",
  };
}
