import * as assert from "assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

import { trackerDashboardUrl } from "../dashboardUrl";
import { formatLogDetails } from "../logger";
import { readCopilotOtelRequests } from "../otel";
import { estimateRequestsCostUsd } from "../pricing";
import {
  planRequestUpload,
  readRequestUploadState,
  writeRequestUploadState,
} from "../requestUploadCache";
import {
  compactStatusText,
  formatCompactNumber,
  formatCurrency,
  formatEstimatedSessionCost,
  formatNumber,
} from "../statusFormatting";
import { SingleFlightTaskQueue } from "../singleFlightTaskQueue";
import {
  createTaskResolverFromHistory,
  readTaskHistoryFromValue,
} from "../taskHistory";
import {
  TrackerClient,
  TrackerClientError,
  extensionSignInUrl,
  parseTrackerServerUrl,
} from "../trackerClient";
import type { CopilotChatRequest, WorkspaceContext } from "../types";
import type { SessionTokenStats } from "../sessionTokenStats";
import type { TaskHistoryEntry } from "../taskHistory";
import { currentSessionTokenStats } from "../sessionTokenStats";
import { getTaskFromBranch } from "../workspaceContext";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Estimates known model cost from input and output tokens", () => {
    assert.strictEqual(
      estimateRequestsCostUsd([
        createChatRequest({
          modelId: "openai/OpenAI/gpt-5-nano",
          inputTokens: 1_000_000,
          outputTokens: 1_000_000,
        }),
      ]),
      0.45,
    );
    assert.strictEqual(
      estimateRequestsCostUsd([
        createChatRequest({
          modelId: "gpt-5.4-nano",
          modelName: null,
          resolvedModel: null,
          inputTokens: 1_000_000,
          outputTokens: 1_000_000,
        }),
      ]),
      1.45,
    );
    assert.strictEqual(
      estimateRequestsCostUsd([
        createChatRequest({
          modelId: "claude-haiku-4.5",
          modelName: null,
          resolvedModel: null,
          inputTokens: 1_000_000,
          outputTokens: 1_000_000,
        }),
      ]),
      6,
    );
  });

  test("Formats status bar task and token text", () => {
    assert.strictEqual(compactStatusText("short-task", 12), "short-task");
    assert.strictEqual(
      compactStatusText("very-long-task-name", 10),
      "very-long…",
    );
    assert.strictEqual(formatNumber(1_234_567), "1,234,567");
    assert.strictEqual(formatCompactNumber(1_234), "1.2K");
    assert.strictEqual(formatCurrency(0.00045), "$0.0005");
  });

  test("Formats estimated session cost as lower bound when token data is incomplete", () => {
    assert.strictEqual(
      formatEstimatedSessionCost(
        createSessionStats({
          estimatedUsd: 0.00045,
          incompleteTokenRequestCount: 0,
        }),
      ),
      "$0.0005",
    );
    assert.strictEqual(
      formatEstimatedSessionCost(
        createSessionStats({
          estimatedUsd: 1.25,
          incompleteTokenRequestCount: 2,
        }),
      ),
      "$1.25+ lower bound",
    );
  });

  test("Builds dashboard URLs with optional encoded session ids", () => {
    assert.strictEqual(
      trackerDashboardUrl("https://copilot-tracker.example.com").toString(),
      "https://copilot-tracker.example.com/dashboard",
    );
    assert.strictEqual(
      trackerDashboardUrl(
        "http://localhost:3737",
        "session/with spaces",
      ).toString(),
      "http://localhost:3737/dashboard?sessionId=session%2Fwith+spaces",
    );
  });

  test("Rejects dashboard URLs for invalid tracker server origins", () => {
    assert.throws(() =>
      trackerDashboardUrl("https://copilot-tracker.example.com/path"),
    );
  });

  test("Detects Azure DevOps numeric task ids from branches", () => {
    assert.strictEqual(getTaskFromBranch("124"), "124");
    assert.strictEqual(getTaskFromBranch("124v2"), "124");
    assert.strictEqual(getTaskFromBranch("feature/124-login"), "124");
    assert.strictEqual(getTaskFromBranch("feature/ABC-123-login"), "123");
    assert.strictEqual(getTaskFromBranch("bugfix/abc-456-login"), "456");
    assert.strictEqual(getTaskFromBranch("main"), null);
    assert.strictEqual(getTaskFromBranch("detached-abc123"), null);
    assert.strictEqual(getTaskFromBranch("feat/v2.1"), null);
    assert.strictEqual(getTaskFromBranch("chore/dependency-1.2.3"), null);
  });

  test("Reads valid task history entries sorted by timestamp", () => {
    const history = readTaskHistoryFromValue([
      { workspaceId: "workspace-1" },
      createTaskHistoryEntry({
        branch: "feature/456-api",
        timestamp: "2026-07-01T00:10:00.000Z",
      }),
      createTaskHistoryEntry({
        branch: "feature/123-login",
        timestamp: "2026-07-01T00:00:00.000Z",
      }),
      {
        ...createTaskHistoryEntry(),
        selectedTask: 123,
      },
    ]);

    assert.deepStrictEqual(
      history.map((entry) => entry.branch),
      ["feature/123-login", "feature/456-api"],
    );
  });

  test("Resolves historical task assignments by request start time", () => {
    const resolver = createTaskResolverFromHistory(
      [
        createTaskHistoryEntry({
          branch: "feature/456-api",
          defaultTask: "456",
          selectedTask: "789",
          timestamp: "2026-07-01T00:10:00.000Z",
        }),
        createTaskHistoryEntry({
          branch: "feature/123-login",
          defaultTask: "123",
          selectedTask: "123",
          timestamp: "2026-07-01T00:00:00.000Z",
        }),
      ],
      createWorkspaceContext(),
    );

    assert.strictEqual(
      resolver(createOtelTaskRequest("2026-06-30T23:59:00.000Z")),
      null,
    );
    assert.deepStrictEqual(
      resolver(createOtelTaskRequest("2026-07-01T00:05:00.000Z")),
      {
        branch: "feature/123-login",
        defaultTask: "123",
        selectedTask: "123",
      },
    );
    assert.deepStrictEqual(
      resolver(createOtelTaskRequest("2026-07-01T00:15:00.000Z")),
      {
        branch: "feature/456-api",
        defaultTask: "456",
        selectedTask: "789",
      },
    );
  });

  test("Task history resolver falls back when manual selection was cleared", () => {
    const resolver = createTaskResolverFromHistory(
      [
        createTaskHistoryEntry({
          branch: "feature/456-api",
          defaultTask: "456",
          selectedTask: null,
          timestamp: "2026-07-01T00:10:00.000Z",
        }),
        createTaskHistoryEntry({
          branch: null,
          defaultTask: null,
          selectedTask: null,
          timestamp: "2026-07-01T00:20:00.000Z",
        }),
      ],
      createWorkspaceContext({
        branch: "fallback-branch",
        defaultTask: "fallback-default",
        selectedTask: "fallback-selected",
      }),
    );

    assert.deepStrictEqual(
      resolver(createOtelTaskRequest("2026-07-01T00:15:00.000Z")),
      {
        branch: "feature/456-api",
        defaultTask: "456",
        selectedTask: "456",
      },
    );
    assert.deepStrictEqual(
      resolver(createOtelTaskRequest("2026-07-01T00:25:00.000Z")),
      {
        branch: "fallback-branch",
        defaultTask: "fallback-default",
        selectedTask: "fallback-selected",
      },
    );
    assert.strictEqual(resolver(createOtelTaskRequest(null)), null);
  });

  test("Redacts local paths, repository remotes, and tokens from structured logs", () => {
    const formatted = formatLogDetails({
      workspacePath: "/Users/example/private-project",
      repositoryRoot: "/Users/example/private-project",
      repositoryRemoteUrl:
        "https://example.com/private-org/private-project.git",
      file: "/Users/example/private-project/.vscode/state.json",
      branch: "feature/123-login",
      accessToken: "secret-token-value",
      nested: {
        storagePath: "/Users/example/Library/Application Support/Code",
        requestCount: 3,
      },
    });

    assert.match(formatted, /"workspacePath": "\[redacted\]"/);
    assert.match(formatted, /"repositoryRoot": "\[redacted\]"/);
    assert.match(formatted, /"repositoryRemoteUrl": "\[redacted\]"/);
    assert.match(formatted, /"file": "\[redacted\]"/);
    assert.match(formatted, /"storagePath": "\[redacted\]"/);
    assert.match(formatted, /"accessToken": "\[redacted\]"/);
    assert.match(formatted, /"branch": "feature\/123-login"/);
    assert.match(formatted, /"requestCount": 3/);
    assert.doesNotMatch(formatted, /\/Users\/example/);
    assert.doesNotMatch(formatted, /private-org/);
    assert.doesNotMatch(formatted, /secret-token-value/);
  });

  test("Upload cache skips unchanged requests and reuploads metadata changes", () => {
    const initialRequest = createChatRequest({
      requestRecordId: "otel:trace-cache-1",
      capturedAt: "2026-07-01T00:00:00.000Z",
    });
    const firstPlan = planRequestUpload([initialRequest], {
      version: 1,
      entries: {},
    });

    assert.strictEqual(firstPlan.requestsToUpload.length, 1);
    assert.strictEqual(firstPlan.skippedUnchangedRequestCount, 0);

    const unchangedPlan = planRequestUpload(
      [
        createChatRequest({
          requestRecordId: "otel:trace-cache-1",
          capturedAt: "2026-07-01T00:05:00.000Z",
        }),
      ],
      firstPlan.nextState,
    );

    assert.strictEqual(unchangedPlan.requestsToUpload.length, 0);
    assert.strictEqual(unchangedPlan.skippedUnchangedRequestCount, 1);

    const changedPlan = planRequestUpload(
      [
        createChatRequest({
          requestRecordId: "otel:trace-cache-1",
          capturedAt: "2026-07-01T00:10:00.000Z",
          selectedTask: "456",
        }),
      ],
      firstPlan.nextState,
    );

    assert.strictEqual(changedPlan.requestsToUpload.length, 1);
    assert.strictEqual(changedPlan.requestsToUpload[0]?.selectedTask, "456");
  });

  test("Upload cache state is stored per workspace and server scope", async () => {
    const store = new MemoryMemento();
    const workspaceContext = createWorkspaceContext();
    const state = {
      version: 1 as const,
      entries: {
        "otel:trace-cache-1": "signature-1",
      },
    };

    await writeRequestUploadState(
      store,
      workspaceContext,
      state,
      "https://tracker-a.example.com",
    );

    assert.deepStrictEqual(
      readRequestUploadState(
        store,
        workspaceContext,
        "https://tracker-a.example.com",
      ),
      state,
    );
    assert.deepStrictEqual(
      readRequestUploadState(
        store,
        {
          ...workspaceContext,
          workspaceId: "other-workspace",
        },
        "https://tracker-a.example.com",
      ),
      { version: 1, entries: {} },
    );
    assert.deepStrictEqual(
      readRequestUploadState(
        store,
        workspaceContext,
        "https://tracker-b.example.com",
      ),
      { version: 1, entries: {} },
    );
  });

  test("Coalesces overlapping lifecycle rebuilds into one queued rerun", async () => {
    const queue = new SingleFlightTaskQueue();
    let runCount = 0;
    let releaseFirstRun!: () => void;
    const firstRunStarted = new Promise<void>((resolve) => {
      const firstRunBlocker = new Promise<void>((release) => {
        releaseFirstRun = release;
      });
      const task = async () => {
        runCount += 1;
        if (runCount === 1) {
          resolve();
          await firstRunBlocker;
        }
      };

      void queue.run(task);
    });

    await firstRunStarted;
    const second = queue.run(async () => undefined);
    const third = queue.run(async () => undefined);
    assert.strictEqual(second, third);

    releaseFirstRun();
    await Promise.all([second, third]);
    assert.strictEqual(runCount, 2);
  });

  test("Validates tracker server URLs as safe origins", () => {
    assert.strictEqual(
      parseTrackerServerUrl("https://copilot-tracker.example.com").origin,
      "https://copilot-tracker.example.com",
    );
    assert.strictEqual(
      parseTrackerServerUrl("http://localhost:3737").origin,
      "http://localhost:3737",
    );
    assert.strictEqual(
      parseTrackerServerUrl("http://[::1]:3737").origin,
      "http://[::1]:3737",
    );

    for (const invalidUrl of [
      "not-a-url",
      "http://copilot-tracker.example.com",
      "https://user:pass@copilot-tracker.example.com",
      "https://copilot-tracker.example.com/base",
      "https://copilot-tracker.example.com?token=value",
      "https://copilot-tracker.example.com#fragment",
    ]) {
      assert.throws(() => parseTrackerServerUrl(invalidUrl));
    }
  });

  test("Builds extension sign-in URL with callback and state", () => {
    const url = extensionSignInUrl(
      new URL("https://copilot-tracker.example.com"),
      vscode.Uri.parse("vscode://antoni-czaplicki.copilot-tracker/auth"),
      "state-123",
    );

    assert.strictEqual(
      url.href,
      "https://copilot-tracker.example.com/api/auth/extension-token?callback=vscode%3A%2F%2Fantoni-czaplicki.copilot-tracker%2Fauth&state=state-123",
    );
  });

  test("TrackerClient stores callback token only when state matches", async () => {
    const secretStorage = new MemorySecretStorage({
      trackerAuthState: "state-123",
    });
    const client = new TrackerClient(secretStorage, new MemoryMemento());

    await client.completeSignIn(
      vscode.Uri.parse(
        "vscode://antoni-czaplicki.copilot-tracker/auth?token=tracker-token&state=state-123",
      ),
    );

    assert.strictEqual(
      await secretStorage.get("trackerAuthToken"),
      "tracker-token",
    );
    assert.strictEqual(await secretStorage.get("trackerAuthState"), undefined);
  });

  test("TrackerClient rejects callback tokens with mismatched state", async () => {
    const secretStorage = new MemorySecretStorage({
      trackerAuthState: "state-123",
    });
    const client = new TrackerClient(secretStorage, new MemoryMemento());

    await assert.rejects(
      client.completeSignIn(
        vscode.Uri.parse(
          "vscode://antoni-czaplicki.copilot-tracker/auth?token=tracker-token&state=wrong",
        ),
      ),
      (error: unknown) =>
        error instanceof TrackerClientError &&
        error.code === "invalid_auth_callback",
    );
    assert.strictEqual(await secretStorage.get("trackerAuthToken"), undefined);
  });

  test("Current session token stats return null without completed token totals", () => {
    assert.strictEqual(
      currentSessionTokenStats([
        createChatRequest({
          inputTokens: 25,
          outputTokens: null,
          totalTokens: null,
        }),
      ]),
      null,
    );
  });

  test("Current session token stats aggregate latest tokenized session", () => {
    const stats = currentSessionTokenStats([
      createChatRequest({
        sessionId: "older-session",
        sessionTitle: "Older session",
        requestCompletedAt: "2026-07-01T09:00:00.000Z",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        totalTokens: 2_000_000,
      }),
      createChatRequest({
        sessionId: "latest-session",
        sessionTitle: "Latest session",
        requestCompletedAt: "2026-07-01T10:00:00.000Z",
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        totalTokens: 2_000_000,
      }),
      createChatRequest({
        sessionId: "latest-session",
        sessionTitle: "Latest session",
        requestCompletedAt: "2026-07-01T10:01:00.000Z",
        inputTokens: 500_000,
        outputTokens: null,
        totalTokens: null,
      }),
      createChatRequest({
        sessionId: "newer-incomplete-session",
        sessionTitle: "Incomplete",
        requestCompletedAt: "2026-07-01T11:00:00.000Z",
        inputTokens: 10,
        outputTokens: null,
        totalTokens: null,
      }),
    ]);

    assert.ok(stats);
    assert.strictEqual(stats.sessionId, "latest-session");
    assert.strictEqual(stats.sessionTitle, "Latest session");
    assert.strictEqual(stats.requestCount, 2);
    assert.strictEqual(stats.incompleteTokenRequestCount, 1);
    assert.strictEqual(stats.inputTokens, 1_500_000);
    assert.strictEqual(stats.outputTokens, 1_000_000);
    assert.strictEqual(stats.totalTokens, 2_000_000);
    assert.strictEqual(stats.estimatedUsd.toFixed(3), "0.475");
  });

  test("TrackerClient searches work items with stored tracker auth", async () => {
    await withTrackerServerUrl("http://localhost:3737", async () => {
      const fetchMock = installFetchMock([
        Response.json({
          workItems: [
            {
              id: 123,
              title: "Fix login",
              state: "Active",
              type: "Bug",
              project: "Project",
              assignedTo: "A Person",
              changedAt: "2026-07-01T00:00:00.000Z",
              url: "https://dev.azure.com/example/project/_workitems/edit/123",
            },
          ],
        }),
      ]);

      try {
        const secretStorage = new MemorySecretStorage({
          trackerAuthToken: "tracker-session-token",
        });
        const client = new TrackerClient(secretStorage, new MemoryMemento());

        const items = await client.searchWorkItems("login task");

        assert.strictEqual(items.length, 1);
        assert.strictEqual(items[0]?.id, 123);
        assert.strictEqual(fetchMock.requests.length, 1);
        assert.strictEqual(
          String(fetchMock.requests[0]?.input),
          "http://localhost:3737/api/azure-devops/work-items?query=login+task",
        );
        assert.strictEqual(
          requestHeader(fetchMock.requests[0], "authorization"),
          "Bearer tracker-session-token",
        );
      } finally {
        fetchMock.restore();
      }
    });
  });

  test("TrackerClient ignores malformed work item search payload entries", async () => {
    await withTrackerServerUrl("http://localhost:3737", async () => {
      const fetchMock = installFetchMock([
        Response.json({
          workItems: [
            {
              id: 123,
              title: "Fix login",
              state: "Active",
              type: "Bug",
              project: "Project",
              assignedTo: "A Person",
              changedAt: "2026-07-01T00:00:00.000Z",
              url: "https://dev.azure.com/example/project/_workitems/edit/123",
            },
            {
              id: "not-a-number",
              title: "Malformed",
              state: "Active",
              type: "Bug",
              project: "Project",
              assignedTo: null,
              changedAt: null,
              url: null,
            },
            {
              id: -1,
              title: "Negative id",
              state: "Active",
              type: "Bug",
              project: "Project",
              assignedTo: null,
              changedAt: null,
              url: null,
            },
            {
              id: 2_147_483_648,
              title: "Too large",
              state: "Active",
              type: "Bug",
              project: "Project",
              assignedTo: null,
              changedAt: null,
              url: null,
            },
            "not-an-object",
          ],
        }),
      ]);

      try {
        const secretStorage = new MemorySecretStorage({
          trackerAuthToken: "tracker-session-token",
        });
        const client = new TrackerClient(secretStorage, new MemoryMemento());

        const items = await client.searchWorkItems("login task");

        assert.strictEqual(items.length, 1);
        assert.strictEqual(items[0]?.id, 123);
      } finally {
        fetchMock.restore();
      }
    });
  });

  test("TrackerClient blocks remote syncs when no token is available", async () => {
    await withTrackerServerUrl("https://tracker.example.com", async () => {
      const fetchMock = installFetchMock([]);

      try {
        const client = new TrackerClient(
          new MemorySecretStorage(),
          new MemoryMemento(),
        );

        await assert.rejects(
          client.sendChatRequests([createChatRequest()]),
          (error: unknown) =>
            error instanceof TrackerClientError &&
            error.code === "not_authenticated",
        );
        assert.strictEqual(fetchMock.requests.length, 0);
      } finally {
        fetchMock.restore();
      }
    });
  });

  test("TrackerClient surfaces server JSON error messages", async () => {
    await withTrackerServerUrl("http://localhost:3737", async () => {
      const fetchMock = installFetchMock([
        Response.json({ error: "bad payload" }, { status: 400 }),
      ]);

      try {
        const client = new TrackerClient(
          new MemorySecretStorage(),
          new MemoryMemento(),
        );

        await assert.rejects(
          client.sendChatRequests([createChatRequest()]),
          (error: unknown) =>
            error instanceof TrackerClientError &&
            error.code === "http_400" &&
            error.status === 400 &&
            error.message === "bad payload",
        );
        assert.strictEqual(fetchMock.requests.length, 1);
      } finally {
        fetchMock.restore();
      }
    });
  });

  test("TrackerClient caps long server JSON error messages", async () => {
    await withTrackerServerUrl("http://localhost:3737", async () => {
      const fetchMock = installFetchMock([
        Response.json({ error: "x".repeat(500) }, { status: 400 }),
      ]);

      try {
        const client = new TrackerClient(
          new MemorySecretStorage(),
          new MemoryMemento(),
        );

        await assert.rejects(
          client.sendChatRequests([createChatRequest()]),
          (error: unknown) =>
            error instanceof TrackerClientError &&
            error.code === "http_400" &&
            error.message === "x".repeat(240),
        );
      } finally {
        fetchMock.restore();
      }
    });
  });

  test("TrackerClient falls back when server error messages are blank", async () => {
    await withTrackerServerUrl("http://localhost:3737", async () => {
      const fetchMock = installFetchMock([
        Response.json({ error: "   " }, { status: 400 }),
      ]);

      try {
        const client = new TrackerClient(
          new MemorySecretStorage(),
          new MemoryMemento(),
        );

        await assert.rejects(
          client.sendChatRequests([createChatRequest()]),
          (error: unknown) =>
            error instanceof TrackerClientError &&
            error.code === "http_400" &&
            error.status === 400 &&
            error.message === "Copilot Tracker server returned HTTP 400",
        );
      } finally {
        fetchMock.restore();
      }
    });
  });

  test("TrackerClient surfaces network failures after retries", async () => {
    await withTrackerServerUrl("http://localhost:3737", async () => {
      const fetchMock = installThrowingFetchMock(
        new Error("socket down"),
        (input) => String(input).includes("/api/chat-requests/batch"),
      );

      try {
        const client = new TrackerClient(
          new MemorySecretStorage(),
          new MemoryMemento(),
        );

        await assert.rejects(
          client.sendChatRequests([createChatRequest()]),
          (error: unknown) =>
            error instanceof TrackerClientError &&
            error.code === "network_error" &&
            error.message === "socket down",
        );
        assert.strictEqual(
          fetchMock.requests.filter((request) =>
            String(request.input).includes("/api/chat-requests/batch"),
          ).length,
          3,
        );
      } finally {
        fetchMock.restore();
      }
    });
  });

  test("Reads Copilot OTel invoke_agent request spans", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await mkdir(path.dirname(otelFilePath), { recursive: true });
      await writeFile(
        otelFilePath,
        `${JSON.stringify(
          createResourceSpanRecord([
            {
              traceId: "trace-1",
              spanId: "span-root-1",
              name: "invoke_agent copilot",
              startTimeUnixNano: "1782638208197000000",
              endTimeUnixNano: "1782638228982000000",
              attributes: attributes({
                "gen_ai.operation.name": "invoke_agent",
                "gen_ai.agent.name": "GitHub Copilot Chat",
                "gen_ai.conversation.id": "session-1",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 22066,
                "gen_ai.usage.output_tokens": 1481,
                "github.copilot.git.repository":
                  "https://github.com/Antoni-Czaplicki/copilot-tracker.git",
                "github.copilot.git.branch": "feature/124-login",
                "copilot_chat.turn_count": 1,
              }),
            },
            {
              traceId: "trace-1",
              spanId: "span-chat-1",
              parentSpanId: "span-root-1",
              name: "chat gpt-5-nano",
              startTimeUnixNano: "1782638209000000000",
              endTimeUnixNano: "1782638228000000000",
              attributes: attributes({
                "gen_ai.operation.name": "chat",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.response.finish_reasons": ["stop"],
                "gen_ai.usage.input_tokens": 22066,
                "gen_ai.usage.output_tokens": 1481,
              }),
            },
          ]),
        )}\n`,
      );

      const workspaceContext = createWorkspaceContext();
      const requests = await readCopilotOtelRequests(
        workspaceContext,
        otelFilePath,
        () => ({
          branch: "feature/124-login",
          defaultTask: "124",
          selectedTask: "124",
        }),
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0]?.requestRecordId, "otel:trace-1");
      assert.strictEqual(requests[0]?.requestId, "trace-1");
      assert.strictEqual(requests[0]?.responseId, "span-root-1");
      assert.strictEqual(requests[0]?.sessionId, "session-1");
      assert.strictEqual(
        requests[0]?.sessionTitle,
        "copilot-tracker - 124 - gpt-5-nano",
      );
      assert.strictEqual(requests[0]?.modelId, "openai/OpenAI/gpt-5-nano");
      assert.strictEqual(requests[0]?.resolvedModel, "gpt-5-nano");
      assert.strictEqual(requests[0]?.inputTokens, 22066);
      assert.strictEqual(requests[0]?.outputTokens, 1481);
      assert.strictEqual(requests[0]?.totalTokens, 23547);
      assert.strictEqual(requests[0]?.tokenSource, "copilot-otel");
      assert.strictEqual(requests[0]?.toolCallRoundCount, 1);
      assert.deepStrictEqual(requests[0]?.stopReasons, ["stop"]);
      assert.strictEqual(requests[0]?.branch, "feature/124-login");
      assert.strictEqual(requests[0]?.selectedTask, "124");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Falls back to summing Copilot OTel chat spans", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        `${JSON.stringify(
          createResourceSpanRecord([
            {
              traceId: "trace-2",
              spanId: "span-root-2",
              name: "invoke_agent copilot",
              startTimeUnixNano: "1782638300000000000",
              endTimeUnixNano: "1782638310000000000",
              attributes: attributes({
                "gen_ai.operation.name": "invoke_agent",
                "gen_ai.agent.name": "GitHub Copilot Chat",
                "gen_ai.conversation.id": "session-2",
                "github.copilot.git.repository":
                  "https://github.com/Antoni-Czaplicki/copilot-tracker",
              }),
            },
            {
              traceId: "trace-2",
              spanId: "span-chat-2a",
              parentSpanId: "span-root-2",
              name: "chat gpt-5-nano",
              startTimeUnixNano: "1782638301000000000",
              endTimeUnixNano: "1782638304000000000",
              attributes: attributes({
                "gen_ai.operation.name": "chat",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 10,
                "gen_ai.usage.output_tokens": 20,
              }),
            },
            {
              traceId: "trace-2",
              spanId: "span-chat-2b",
              parentSpanId: "span-root-2",
              name: "chat gpt-5-nano",
              startTimeUnixNano: "1782638305000000000",
              endTimeUnixNano: "1782638309000000000",
              attributes: attributes({
                "gen_ai.operation.name": "chat",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 5,
                "gen_ai.usage.output_tokens": 6,
              }),
            },
          ]),
        )}\n`,
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext(),
        otelFilePath,
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0]?.requestRecordId, "otel:trace-2");
      assert.strictEqual(requests[0]?.inputTokens, 15);
      assert.strictEqual(requests[0]?.outputTokens, 26);
      assert.strictEqual(requests[0]?.totalTokens, 41);
      assert.strictEqual(requests[0]?.toolCallRoundCount, 2);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Reads Copilot OTel inference event log records", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        [
          createPlainLogRecord({
            traceId: "trace-log-1",
            spanId: "span-log-1",
            hrTime: [1782642443, 672000000],
            body: "copilot_chat.session.start",
            resourceSessionId: "vscode-session-1",
            attributes: {
              "event.name": "copilot_chat.session.start",
              "session.id": "chat-session-1",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.agent.name": "GitHub Copilot Chat",
            },
          }),
          createPlainLogRecord({
            traceId: "trace-log-1",
            spanId: "span-log-1",
            hrTime: [1782642449, 664000000],
            body: "GenAI inference: gpt-5-nano",
            resourceSessionId: "vscode-session-1",
            attributes: {
              "event.name": "gen_ai.client.inference.operation.details",
              "gen_ai.operation.name": "chat",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.response.model": "gpt-5-nano-2025-08-07",
              "gen_ai.response.id": "response-log-1",
              "gen_ai.response.finish_reasons": ["stop"],
              "gen_ai.usage.input_tokens": 22266,
              "gen_ai.usage.output_tokens": 233,
            },
          }),
          createPlainLogRecord({
            traceId: "trace-log-1",
            spanId: "span-log-1",
            hrTime: [1782642449, 688000000],
            body: "copilot_chat.agent.turn: 0",
            resourceSessionId: "vscode-session-1",
            attributes: {
              "event.name": "copilot_chat.agent.turn",
              "turn.index": 0,
              "gen_ai.usage.input_tokens": 22266,
              "gen_ai.usage.output_tokens": 233,
              tool_call_count: 0,
            },
          }),
        ]
          .map((record) => JSON.stringify(record))
          .join("\n"),
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext(),
        otelFilePath,
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(
        requests[0]?.requestRecordId,
        "otel-log:trace-log-1:response-log-1",
      );
      assert.strictEqual(requests[0]?.requestId, "trace-log-1");
      assert.strictEqual(requests[0]?.responseId, "response-log-1");
      assert.strictEqual(requests[0]?.sessionId, "chat-session-1");
      assert.strictEqual(
        requests[0]?.sessionTitle,
        "copilot-tracker - main - gpt-5-nano",
      );
      assert.strictEqual(requests[0]?.modelId, "gpt-5-nano");
      assert.strictEqual(requests[0]?.resolvedModel, "gpt-5-nano-2025-08-07");
      assert.strictEqual(requests[0]?.inputTokens, 22266);
      assert.strictEqual(requests[0]?.outputTokens, 233);
      assert.strictEqual(requests[0]?.totalTokens, 22499);
      assert.strictEqual(requests[0]?.tokenSource, "copilot-otel");
      assert.deepStrictEqual(requests[0]?.stopReasons, ["stop"]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Uses matched VS Code chat session titles for OTel requests", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        JSON.stringify(
          createPlainLogRecord({
            traceId: "trace-title-1",
            spanId: "span-title-1",
            hrTime: [1782643951, 813000000],
            body: "GenAI inference: gpt-5-nano",
            resourceSessionId: "otel-session-title-1",
            attributes: {
              "event.name": "gen_ai.client.inference.operation.details",
              "gen_ai.operation.name": "chat",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.response.model": "gpt-5-nano-2025-08-07",
              "gen_ai.response.id": "response-title-1",
              "gen_ai.usage.input_tokens": 21908,
              "gen_ai.usage.output_tokens": 907,
            },
          }),
        ),
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext(),
        otelFilePath,
        undefined,
        (request) =>
          request.traceId === "trace-title-1"
            ? {
                sessionId: "vscode-chat-session-1",
                sessionTitle:
                  "Second Copilot Tracker smoke test. What is 2 + 2?",
                sessionCreatedAt: "2026-06-28T10:52:15.138Z",
              }
            : null,
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0]?.sessionId, "otel-session-title-1");
      assert.strictEqual(
        requests[0]?.sessionTitle,
        "Second Copilot Tracker smoke test. What is 2 + 2?",
      );
      assert.strictEqual(
        requests[0]?.sessionCreatedAt,
        "2026-06-28T10:52:15.138Z",
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

function createWorkspaceContext(
  overrides: Partial<WorkspaceContext> = {},
): WorkspaceContext {
  return {
    workspaceId: "workspace-id",
    workspacePath: "/tmp/copilot-tracker",
    workspaceName: "copilot-tracker",
    repositoryRoot: "/tmp/copilot-tracker",
    repositoryRemoteUrl:
      "https://github.com/Antoni-Czaplicki/copilot-tracker.git",
    branch: "main",
    defaultTask: null,
    selectedTask: null,
    ...overrides,
  };
}

function createTaskHistoryEntry(
  overrides: Partial<TaskHistoryEntry> = {},
): TaskHistoryEntry {
  return {
    workspaceId: "workspace-id",
    timestamp: "2026-07-01T00:00:00.000Z",
    branch: "main",
    defaultTask: null,
    selectedTask: null,
    source: "test",
    ...overrides,
  };
}

function createOtelTaskRequest(requestStartedAt: string | null) {
  return {
    traceId: "trace-1",
    conversationId: "session-1",
    requestStartedAt,
    requestCompletedAt: null,
  };
}

function createSessionStats(
  overrides: Partial<SessionTokenStats> = {},
): SessionTokenStats {
  return {
    sessionId: "session-1",
    sessionTitle: "Implement login",
    requestCount: 1,
    incompleteTokenRequestCount: 0,
    inputTokens: 100,
    outputTokens: 200,
    totalTokens: 300,
    estimatedUsd: 0.0001,
    ...overrides,
  };
}

function createChatRequest(
  overrides: Partial<CopilotChatRequest> = {},
): CopilotChatRequest {
  return {
    ...createWorkspaceContext(),
    requestRecordId: "otel:trace-cache",
    requestId: "trace-cache",
    responseId: "span-cache",
    sessionId: "session-cache",
    sessionTitle: "Cache test",
    sessionCreatedAt: null,
    requestStartedAt: "2026-07-01T00:00:00.000Z",
    requestCompletedAt: "2026-07-01T00:00:30.000Z",
    modelId: "gpt-5-nano",
    resolvedModel: "gpt-5-nano",
    modelName: null,
    modelVendor: null,
    modelFamily: null,
    inputTokens: 10,
    outputTokens: 20,
    totalTokens: 30,
    tokenSource: "copilot-otel",
    promptTokenDetails: [],
    toolCallRoundCount: 1,
    stopReasons: ["stop"],
    capturedAt: "2026-07-01T00:00:31.000Z",
    ...overrides,
  };
}

class MemoryMemento {
  private readonly values = new Map<string, unknown>();

  public get<T>(key: string): T | undefined {
    return this.values.get(key) as T | undefined;
  }

  public async update(key: string, value: unknown): Promise<void> {
    this.values.set(key, value);
  }

  public keys(): readonly string[] {
    return [...this.values.keys()];
  }
}

class MemorySecretStorage {
  private readonly values = new Map<string, string>();

  public constructor(initialValues: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(initialValues)) {
      this.values.set(key, value);
    }
  }

  public async get(key: string): Promise<string | undefined> {
    return this.values.get(key);
  }

  public async store(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  public async delete(key: string): Promise<void> {
    this.values.delete(key);
  }
}

async function withTrackerServerUrl<T>(
  serverUrl: string,
  run: () => Promise<T>,
): Promise<T> {
  const config = vscode.workspace.getConfiguration("copilot-tracker");
  const previousGlobalValue = config.inspect<string>("serverUrl")?.globalValue;
  await config.update(
    "serverUrl",
    serverUrl,
    vscode.ConfigurationTarget.Global,
  );
  try {
    return await run();
  } finally {
    await config.update(
      "serverUrl",
      previousGlobalValue,
      vscode.ConfigurationTarget.Global,
    );
  }
}

function installFetchMock(responses: Response[]) {
  const originalFetch = globalThis.fetch;
  const requests: CapturedFetch[] = [];

  globalThis.fetch = async (input, init) => {
    requests.push({ input, init });
    await Promise.resolve();
    const response = responses.shift();
    if (!response) {
      throw new Error("Unexpected fetch call");
    }
    return response;
  };

  return {
    requests,
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

function installThrowingFetchMock(
  error: Error,
  shouldThrow: (input: Parameters<typeof fetch>[0]) => boolean,
) {
  const originalFetch = globalThis.fetch;
  const requests: CapturedFetch[] = [];

  globalThis.fetch = async (input, init) => {
    requests.push({ input, init });
    await Promise.resolve();
    if (shouldThrow(input)) {
      throw error;
    }
    return Response.json({});
  };

  return {
    requests,
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

function requestHeader(request: CapturedFetch | undefined, name: string) {
  if (request === undefined) {
    assert.fail("request should be captured");
  }
  const headers = request.init?.headers;
  if (!headers || headers instanceof Headers || Array.isArray(headers)) {
    assert.fail("request headers should be a plain object");
  }
  return headers[name];
}

interface CapturedFetch {
  input: Parameters<typeof fetch>[0];
  init?: Parameters<typeof fetch>[1];
}

function createResourceSpanRecord(spans: unknown[]) {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: attributes({
            "service.name": "copilot-chat",
            "session.id": "vscode-window-session",
          }),
        },
        scopeSpans: [
          {
            spans,
          },
        ],
      },
    ],
  };
}

function createPlainLogRecord({
  traceId,
  spanId,
  hrTime,
  body,
  resourceSessionId,
  attributes: recordAttributes,
}: {
  traceId: string;
  spanId: string;
  hrTime: [number, number];
  body: string;
  resourceSessionId: string;
  attributes: Record<string, unknown>;
}) {
  return {
    hrTime,
    hrTimeObserved: hrTime,
    spanContext: {
      traceId,
      spanId,
      traceFlags: 1,
    },
    resource: {
      _rawAttributes: [
        ["service.name", "copilot-chat"],
        ["service.version", "0.54.0"],
        ["session.id", resourceSessionId],
        [
          "github.copilot.git.repository",
          "https://github.com/Antoni-Czaplicki/copilot-tracker.git",
        ],
      ],
      _asyncAttributesPending: false,
    },
    instrumentationScope: {
      name: "copilot-chat",
      version: "0.54.0",
    },
    attributes: recordAttributes,
    _body: body,
    totalAttributesCount: Object.keys(recordAttributes).length,
    _isReadonly: true,
    _logRecordLimits: {
      attributeCountLimit: 128,
      attributeValueLengthLimit: null,
    },
  };
}

function attributes(values: Record<string, unknown>) {
  return Object.entries(values).map(([key, value]) => ({
    key,
    value: otelValue(value),
  }));
}

function otelValue(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    return { stringValue: value };
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { intValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "boolean") {
    return { boolValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(otelValue) } };
  }

  return { stringValue: String(value) };
}
