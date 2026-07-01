import assert from "node:assert/strict";
import { test } from "node:test";

import { exportCsv, parseExportType } from "./adminExport";
import type { StoredChatRequest, TrackerDatabase } from "./store";

void test("parseExportType accepts known export types and rejects unknown values", () => {
  assert.equal(parseExportType("requests"), "requests");
  assert.equal(parseExportType("github-billing"), "github-billing");
  assert.equal(parseExportType("secrets"), null);
  assert.equal(parseExportType(""), null);
});

void test("exportCsv quotes request cells with commas, quotes, and newlines", () => {
  const csv = exportCsv(
    "requests",
    createDatabase({
      chatRequests: [
        createChatRequest({
          sessionTitle: 'Fix "login", quickly',
          selectedTask: "Task\n42",
        }),
      ],
    }),
  );

  assert.match(csv, /^requestRecordId,userLogin,userId,githubLogin,/);
  assert.match(csv, /"Fix ""login"", quickly"/);
  assert.match(csv, /"Task\n42"/);
});

void test("exportCsv excludes captured-only placeholder requests", () => {
  const csv = exportCsv(
    "requests",
    createDatabase({
      chatRequests: [
        createChatRequest({ requestRecordId: "meaningful-record" }),
        createChatRequest({
          requestRecordId: "placeholder-record",
          requestId: null,
          responseId: null,
          modelId: null,
          resolvedModel: null,
          modelName: null,
          inputTokens: null,
          outputTokens: null,
          totalTokens: null,
        }),
      ],
    }),
  );

  assert.match(csv, /meaningful-record/);
  assert.doesNotMatch(csv, /placeholder-record/);
});

void test("exportCsv emits GitHub billing exports without request data", () => {
  const csv = exportCsv(
    "github-billing",
    createDatabase({
      githubCopilotBillingUsage: [
        {
          id: "billing-1",
          scopeType: "organization",
          scope: "redacted-org",
          date: "2026-07-01",
          product: "Copilot",
          sku: "Business",
          quantity: "3",
          unitType: "seats",
          grossAmount: "30.00",
          discountAmount: "0.00",
          netAmount: "30.00",
          raw: {},
          fetchedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    }),
  );

  assert.equal(
    csv,
    [
      [
        "scopeType",
        "scope",
        "date",
        "product",
        "sku",
        "quantity",
        "unitType",
        "grossAmount",
        "discountAmount",
        "netAmount",
        "fetchedAt",
      ].join(","),
      [
        "organization",
        "redacted-org",
        "2026-07-01",
        "Copilot",
        "Business",
        "3",
        "seats",
        "30.00",
        "0.00",
        "30.00",
        "2026-07-01T00:00:00.000Z",
      ].join(","),
    ].join("\n"),
  );
});

function createDatabase(overrides: Partial<TrackerDatabase> = {}) {
  return {
    users: [],
    sessions: [],
    events: [],
    chatRequests: [],
    githubCopilotBillingUsage: [],
    ...overrides,
  };
}

function createChatRequest(
  overrides: Partial<StoredChatRequest> = {},
): StoredChatRequest {
  return {
    workspaceId: "workspace-1",
    workspacePath: "/tmp/copilot-tracker",
    workspaceName: "copilot-tracker",
    repositoryRoot: "/tmp/copilot-tracker",
    repositoryRemoteUrl: "https://example.com/redacted/repo.git",
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
    userLogin: "dev",
    userId: "user-1",
    githubLogin: "devhub",
    ...overrides,
  };
}
