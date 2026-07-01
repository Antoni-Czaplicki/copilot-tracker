import type { CopilotChatRequest } from "@copilot-tracker/shared";
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  developerTaskSummaries,
  getRepositoryName,
  getRequestActivityTimestamp,
  modelSummaries,
  publicLeaderboard,
  summarizeRequests,
  taskSummaries,
} from "./analytics";
import type { StoredChatRequest, TrackerDatabase } from "./store";

void test("summarizeRequests filters placeholder rows and aggregates token metrics", () => {
  const summary = summarizeRequests([
    createRequest({
      inputTokens: 1_000_000,
      outputTokens: 2_000_000,
      totalTokens: 3_000_000,
      requestCompletedAt: "2026-07-01T12:30:00.000Z",
    }),
    createRequest({
      inputTokens: null,
      modelId: null,
      modelName: null,
      outputTokens: null,
      requestId: null,
      responseId: null,
      resolvedModel: null,
      totalTokens: null,
    }),
  ]);

  assert.equal(summary.requestCount, 1);
  assert.equal(summary.missingTokenCount, 0);
  assert.equal(summary.inputTokens, 1_000_000);
  assert.equal(summary.outputTokens, 2_000_000);
  assert.equal(summary.totalTokens, 3_000_000);
  assert.equal(summary.averageTokensPerRequest, 3_000_000);
  assert.equal(summary.estimatedUsd.toFixed(2), "0.85");
  assert.equal(summary.lastRequestAt, "2026-07-01T12:30:00.000Z");
});

void test("taskSummaries groups by task, repository, and branch sorted by latest activity", () => {
  const rows = taskSummaries([
    createRequest({
      branch: "feature/old",
      repositoryRoot: "/work/alpha",
      requestCompletedAt: "2026-07-01T08:00:00.000Z",
      selectedTask: "123",
      totalTokens: 300,
    }),
    createRequest({
      branch: "feature/new",
      repositoryRoot: "/work/beta",
      requestCompletedAt: "2026-07-01T09:00:00.000Z",
      selectedTask: "456",
      totalTokens: 100,
    }),
  ]);

  assert.deepEqual(
    rows.map((row) => ({
      task: row.task,
      repositoryName: row.repositoryName,
      branch: row.branch,
      totalTokens: row.totalTokens,
    })),
    [
      {
        task: "456",
        repositoryName: "beta",
        branch: "feature/new",
        totalTokens: 100,
      },
      {
        task: "123",
        repositoryName: "alpha",
        branch: "feature/old",
        totalTokens: 300,
      },
    ],
  );
});

void test("developerTaskSummaries falls back to default tasks and sorts by tokens", () => {
  const rows = developerTaskSummaries([
    createStoredRequest({
      defaultTask: "111",
      selectedTask: null,
      totalTokens: 50,
      userId: "u1",
      userLogin: "person@example.com",
    }),
    createStoredRequest({
      defaultTask: "222",
      selectedTask: "333",
      totalTokens: 500,
      userId: "u1",
      userLogin: "person@example.com",
    }),
  ]);

  assert.deepEqual(
    rows.map((row) => ({ task: row.task, totalTokens: row.totalTokens })),
    [
      { task: "333", totalTokens: 500 },
      { task: "111", totalTokens: 50 },
    ],
  );
});

void test("publicLeaderboard ranks users by meaningful token totals", () => {
  const rows = publicLeaderboard({
    chatRequests: [
      createStoredRequest({
        totalTokens: 100,
        userId: "u1",
        userLogin: "old@example.com",
      }),
      createStoredRequest({
        totalTokens: 300,
        userId: "u2",
        userLogin: "second@example.com",
      }),
    ],
    events: [],
    githubCopilotBillingUsage: [],
    sessions: [],
    users: [
      createUser({ githubLogin: "first-gh", login: "first@example.com", userId: "u1" }),
      createUser({ githubLogin: "second-gh", login: "second@example.com", userId: "u2" }),
    ],
  });

  assert.deepEqual(
    rows.map((row) => ({
      rank: row.rank,
      login: row.userLogin,
      githubLogin: row.githubLogin,
      totalTokens: row.totalTokens,
    })),
    [
      {
        rank: 1,
        login: "second@example.com",
        githubLogin: "second-gh",
        totalTokens: 300,
      },
      {
        rank: 2,
        login: "first@example.com",
        githubLogin: "first-gh",
        totalTokens: 100,
      },
    ],
  );
});

void test("modelSummaries groups known and unknown model names", () => {
  const rows = modelSummaries([
    createRequest({ modelId: "gpt-5-nano", totalTokens: 100 }),
    createRequest({
      modelId: null,
      modelName: null,
      resolvedModel: null,
      totalTokens: 50,
    }),
  ]);

  assert.deepEqual(
    rows.map((row) => ({ model: row.model, totalTokens: row.totalTokens })),
    [
      { model: "gpt-5-nano", totalTokens: 100 },
      { model: "unknown", totalTokens: 50 },
    ],
  );
});

void test("repository and activity helpers tolerate fallbacks and invalid dates", () => {
  assert.equal(
    getRepositoryName({
      repositoryRoot: "C:\\work\\copilot-tracker\\",
      workspaceName: null,
      workspacePath: null,
    }),
    "copilot-tracker",
  );
  assert.equal(
    getRepositoryName({
      repositoryRoot: null,
      workspaceName: "workspace-name",
      workspacePath: "/fallback/path",
    }),
    "workspace-name",
  );
  assert.equal(
    getRequestActivityTimestamp({
      capturedAt: "not-a-date",
      requestCompletedAt: null,
      requestStartedAt: null,
    }),
    0,
  );
});

function createRequest(
  overrides: Partial<CopilotChatRequest> = {},
): CopilotChatRequest {
  return {
    branch: "feature/123-login",
    capturedAt: "2026-07-01T12:00:00.000Z",
    defaultTask: "123",
    inputTokens: 10,
    modelFamily: "gpt-5",
    modelId: "gpt-5-nano",
    modelName: "gpt-5-nano",
    modelVendor: "openai",
    outputTokens: 20,
    promptTokenDetails: [],
    repositoryRemoteUrl: "https://example.com/org/repo.git",
    repositoryRoot: "/work/copilot-tracker",
    requestCompletedAt: "2026-07-01T12:00:30.000Z",
    requestId: "request-1",
    requestRecordId: "record-1",
    requestStartedAt: "2026-07-01T12:00:00.000Z",
    resolvedModel: "gpt-5-nano",
    responseId: "response-1",
    selectedTask: "123",
    sessionCreatedAt: "2026-07-01T11:59:00.000Z",
    sessionId: "session-1",
    sessionTitle: "Implement login",
    stopReasons: ["stop"],
    tokenSource: "copilot-otel",
    toolCallRoundCount: 1,
    totalTokens: 30,
    workspaceId: "workspace-1",
    workspaceName: "copilot-tracker",
    workspacePath: "/work/copilot-tracker",
    ...overrides,
  };
}

function createStoredRequest(
  overrides: Partial<StoredChatRequest> = {},
): StoredChatRequest {
  return {
    ...createRequest(overrides),
    githubLogin: null,
    userId: null,
    userLogin: null,
    ...overrides,
  };
}

function createUser(
  overrides: Partial<TrackerDatabase["users"][number]> = {},
): TrackerDatabase["users"][number] {
  return {
    avatarUrl: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    email: null,
    githubLogin: null,
    lastSeenAt: "2026-07-01T00:00:00.000Z",
    login: "person@example.com",
    name: null,
    role: "user",
    userId: "user-id",
    ...overrides,
  };
}
