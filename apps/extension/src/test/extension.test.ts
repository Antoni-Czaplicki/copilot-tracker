import * as assert from "assert";
import {
  appendFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";

import { branchTaskSwitchPrompt } from "../branchTaskPrompt";
import {
  createChatSessionTitleResolver,
  findWorkspaceStorage,
  findWorkspaceStorages,
} from "../chatSessionTitles";
import { trackerDashboardUrl } from "../dashboardUrl";
import { formatLogDetails } from "../logger";
import {
  normalizeRepositoryRemoteUrl,
  readCopilotOtelRequestsFromRecords,
} from "../otel";
import { startOtlpHttpReceiver } from "../otlpHttpReceiver";
import {
  appendOtlpSpoolRecords,
  otlpSpoolPath,
  readOtlpSpoolRecords,
  statOtlpSpool,
} from "../otlpRecordSpool";
import {
  decodeOtlpHttpPayload,
  encodeOtlpHttpPayload,
} from "../otlpProto";
import { estimateRequestsCostUsd } from "../pricing";
import {
  planRequestUpload,
  readRequestUploadState,
  writeRequestUploadState,
} from "../requestUploadCache";
import type { SessionTokenStats } from "../sessionTokenStats";
import { currentSessionTokenStats } from "../sessionTokenStats";
import { SingleFlightTaskQueue } from "../singleFlightTaskQueue";
import {
  compactStatusText,
  formatCompactNumber,
  formatCurrency,
  formatEstimatedSessionCost,
  formatNumber,
} from "../statusFormatting";
import {
  defaultTaskBranchBaseBranches,
  defaultTaskBranchNamePrefix,
  isTaskBranchBaseBranch,
  normalizeTaskBranchNamePrefix,
  normalizeTaskBranchBaseBranches,
  parseGitBranchRefs,
  suggestedTaskBranchName,
  validateTaskBranchName,
} from "../taskBranchSwitch";
import {
  createTaskResolverFromHistory,
  latestTaskHistoryForWorkspace,
  readTaskHistoryFromValue,
  shouldRecordTaskHistoryEntry,
} from "../taskHistory";
import type { TaskHistoryEntry } from "../taskHistory";
import {
  type AzureDevOpsWorkItem,
  TrackerClient,
  TrackerClientError,
  type TrackerConfigurationInspect,
  type TrackerConfigurationSource,
  extensionSignInUrl,
  getTrackerConfigFromConfiguration,
  parseTrackerServerUrl,
} from "../trackerClient";
import type { CopilotChatRequest, WorkspaceContext } from "../types";
import {
  azureDevOpsProjectFromRemoteUrl,
  isTerminalWorkItemState,
  safeWorkItemUrl,
  sortWorkItemsForQuickPick,
  workItemQuickPickItem,
  workItemTypeCodicon,
} from "../workItemQuickPick";
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

  test("Reads tracker config defaults and normalizes the OTLP HTTP port", () => {
    const config = createTrackerConfigurationSource({
      globalValues: {
        otelHttpPort: 12345,
      },
      workspaceValues: {
        otelHttpPort: 23456,
      },
    });

    assert.strictEqual(
      getTrackerConfigFromConfiguration(config).otelHttpPort,
      23456,
    );
    assert.deepStrictEqual(
      getTrackerConfigFromConfiguration(config).taskBranchBaseBranches,
      defaultTaskBranchBaseBranches,
    );
    assert.strictEqual(
      getTrackerConfigFromConfiguration(config).taskBranchNamePrefix,
      defaultTaskBranchNamePrefix,
    );

    const invalidPortConfig = createTrackerConfigurationSource({
      globalValues: {
        otelHttpPort: Number.NaN,
      },
    });
    assert.strictEqual(
      getTrackerConfigFromConfiguration(invalidPortConfig).otelHttpPort,
      4318,
    );

    const ticketPrefixConfig = createTrackerConfigurationSource({
      globalValues: {
        taskBranchNamePrefix: "ticket/",
      },
    });
    assert.strictEqual(
      getTrackerConfigFromConfiguration(ticketPrefixConfig).taskBranchNamePrefix,
      "",
    );
  });

  test("Activates on startup before Copilot Chat captures OTel settings", async () => {
    const manifestPath = path.join(__dirname, "../../package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      activationEvents?: string[];
    };

    assert.ok(manifest.activationEvents?.includes("*"));
    assert.ok(!manifest.activationEvents?.includes("onStartupFinished"));
  });

  test("Matches VS Code workspace storage written with a Windows file URI", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "vscode-storage-"));

    try {
      const storagePath = path.join(tempDir, "windows-workspace");
      await mkdir(storagePath, { recursive: true });
      await writeFile(
        path.join(storagePath, "workspace.json"),
        JSON.stringify({
          folder: "file:///c%3A/Users/example/source/copilot-tracker",
        }),
      );

      const match = await findWorkspaceStorage(
        tempDir,
        createWorkspaceContext({
          workspacePath: "C:\\Users\\example\\source\\copilot-tracker",
          repositoryRoot: "C:\\Users\\example\\source\\copilot-tracker",
        }),
      );

      assert.strictEqual(match?.storagePath, storagePath);
      assert.strictEqual(
        match?.chatSessionsPath,
        path.join(storagePath, "chatSessions"),
      );
      assert.strictEqual(
        match?.stateDbPath,
        path.join(storagePath, "state.vscdb"),
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Matches moved VS Code workspace storage by a single folder-name match", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "vscode-storage-"));

    try {
      const storagePath = path.join(tempDir, "moved-workspace");
      const otherStoragePath = path.join(tempDir, "other-workspace");
      await mkdir(storagePath, { recursive: true });
      await mkdir(otherStoragePath, { recursive: true });
      await writeFile(
        path.join(storagePath, "workspace.json"),
        JSON.stringify({
          folder: "file:///c%3A/Users/old-pc/source/copilot-tracker",
        }),
      );
      await writeFile(
        path.join(otherStoragePath, "workspace.json"),
        JSON.stringify({
          folder: "file:///c%3A/Users/old-pc/source/other-project",
        }),
      );

      const match = await findWorkspaceStorage(
        tempDir,
        createWorkspaceContext({
          workspacePath: "D:\\dev\\copilot-tracker",
          repositoryRoot: "D:\\dev\\copilot-tracker",
        }),
      );

      assert.strictEqual(match?.storagePath, storagePath);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Matches VS Code workspace storage from any multi-root folder", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "vscode-storage-"));

    try {
      const storagePath = path.join(tempDir, "multi-root-workspace");
      await mkdir(storagePath, { recursive: true });
      await writeFile(
        path.join(storagePath, "workspace.json"),
        JSON.stringify({
          folders: [
            {
              path: "file:///c%3A/projects/platform/frontend",
            },
            {
              path: "file:///c%3A/projects/platform/backend",
            },
          ],
        }),
      );

      const match = await findWorkspaceStorage(
        tempDir,
        createWorkspaceContext({
          workspacePath: "C:\\projects\\platform\\backend",
          repositoryRoot: "C:\\projects\\platform\\backend",
          workspaceFolderPaths: [
            "C:\\projects\\platform\\frontend",
            "C:\\projects\\platform\\backend",
          ],
        }),
      );

      assert.strictEqual(match?.storagePath, storagePath);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Matches VS Code workspace storage from code-workspace file path", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "vscode-storage-"));

    try {
      const storagePath = path.join(tempDir, "code-workspace");
      await mkdir(storagePath, { recursive: true });
      await writeFile(
        path.join(storagePath, "workspace.json"),
        JSON.stringify({
          workspace:
            "file:///c%3A/Users/example/source/product/product.code-workspace",
        }),
      );

      const match = await findWorkspaceStorage(
        tempDir,
        createWorkspaceContext({
          workspacePath: "C:\\Users\\example\\source\\product\\frontend",
          repositoryRoot: "C:\\Users\\example\\source\\product\\frontend",
          workspaceFilePath:
            "C:\\Users\\example\\source\\product\\product.code-workspace",
        }),
      );

      assert.strictEqual(match?.storagePath, storagePath);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Reads VS Code chat session index with built-in SQLite", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "vscode-storage-"));

    try {
      const chatSessionsPath = path.join(tempDir, "chatSessions");
      await mkdir(chatSessionsPath, { recursive: true });
      await writeStateDb(path.join(tempDir, "state.vscdb"), {
        entries: {
          "vscode-chat-session-1": {
            sessionId: "vscode-chat-session-1",
            title: "Investigate Windows storage matching",
            timing: { created: 1782918561664 },
            lastMessageDate: 1782918567664,
            isEmpty: false,
          },
          "vscode-chat-session-custom-title": {
            sessionId: "vscode-chat-session-custom-title",
            title: "New Chat",
            timing: { created: 1782918600000 },
            lastMessageDate: 1782918605000,
            isEmpty: false,
          },
        },
      });
      await writeFile(
        path.join(chatSessionsPath, "vscode-chat-session-1.json"),
        JSON.stringify({
          kind: 0,
          v: {
            sessionId: "vscode-chat-session-1",
            creationDate: 1782918561664,
            requests: [{ timestamp: 1782918567664 }],
          },
        }),
      );
      await writeFile(
        path.join(chatSessionsPath, "vscode-chat-session-custom-title.jsonl"),
        [
          {
            kind: 0,
            v: {
              sessionId: "vscode-chat-session-custom-title",
              creationDate: 1782918600000,
              requests: [{ timestamp: 1782918605000 }],
            },
          },
          {
            kind: 1,
            k: "customTitle",
            v: "GREETING MESSAGE",
          },
        ]
          .map((record) => JSON.stringify(record))
          .join("\n"),
      );

      const resolveSession = await createChatSessionTitleResolver(
        createWorkspaceContext(),
        tempDir,
      );

      assert.deepStrictEqual(
        resolveSession({
          traceId: "trace-chat-title-sqlite",
          conversationId: "vscode-chat-session-1",
          requestStartedAt: null,
          requestCompletedAt: null,
          sessionCreatedAt: null,
          modelId: null,
          resolvedModel: null,
          inputTokens: null,
          outputTokens: null,
        }),
        {
          sessionId: "vscode-chat-session-1",
          sessionTitle: "Investigate Windows storage matching",
          sessionCreatedAt: "2026-07-01T15:09:21.664Z",
        },
      );
      assert.deepStrictEqual(
        resolveSession({
          traceId: "trace-chat-title-custom",
          conversationId: "vscode-chat-session-custom-title",
          requestStartedAt: null,
          requestCompletedAt: null,
          sessionCreatedAt: null,
          modelId: null,
          resolvedModel: null,
          inputTokens: null,
          outputTokens: null,
        }),
        {
          sessionId: "vscode-chat-session-custom-title",
          sessionTitle: "GREETING MESSAGE",
          sessionCreatedAt: "2026-07-01T15:10:00.000Z",
        },
      );
      assert.strictEqual(
        resolveSession({
          traceId: "trace-chat-title-sqlite-session-time",
          conversationId: "otel-chat-session-1",
          requestStartedAt: null,
          requestCompletedAt: null,
          sessionCreatedAt: "2026-07-01T15:09:21.664Z",
          modelId: null,
          resolvedModel: null,
          inputTokens: null,
          outputTokens: null,
        }),
        null,
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Resolves chat title from exact session id across ranked storage matches", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "vscode-storage-"));

    try {
      const olderStoragePath = path.join(tempDir, "older-workspace");
      const currentStoragePath = path.join(tempDir, "current-workspace");
      await mkdir(path.join(olderStoragePath, "chatSessions"), {
        recursive: true,
      });
      await mkdir(path.join(currentStoragePath, "chatSessions"), {
        recursive: true,
      });
      await writeFile(
        path.join(olderStoragePath, "workspace.json"),
        JSON.stringify({
          folder: "file:///c%3A/Users/old/source/copilot-tracker",
        }),
      );
      await writeFile(
        path.join(currentStoragePath, "workspace.json"),
        JSON.stringify({
          folder: "file:///d%3A/dev/copilot-tracker",
        }),
      );
      await writeStateDb(path.join(olderStoragePath, "state.vscdb"), {
        entries: {
          "older-chat-session": {
            sessionId: "older-chat-session",
            title: "Wrong storage title",
            timing: { created: 1782918561664 },
            isEmpty: false,
          },
        },
      });
      await writeStateDb(path.join(currentStoragePath, "state.vscdb"), {
        entries: {
          "current-chat-session": {
            sessionId: "current-chat-session",
            title: "Correct storage title",
            timing: { created: 1782918600000 },
            isEmpty: false,
          },
        },
      });

      const workspaceContext = createWorkspaceContext({
        workspacePath: "D:\\dev\\copilot-tracker",
        repositoryRoot: "D:\\dev\\copilot-tracker",
      });
      const currentExtensionStoragePath = path.join(
        currentStoragePath,
        "antoni-czaplicki.copilot-tracker",
      );

      const matches = await findWorkspaceStorages(
        tempDir,
        workspaceContext,
        currentExtensionStoragePath,
      );
      assert.strictEqual(matches[0]?.storagePath, currentStoragePath);

      const resolveSession = await createChatSessionTitleResolver(
        workspaceContext,
        tempDir,
        currentExtensionStoragePath,
      );

      assert.deepStrictEqual(
        resolveSession({
          traceId: "trace-ranked-storage",
          conversationId: "current-chat-session",
          requestStartedAt: null,
          requestCompletedAt: null,
          sessionCreatedAt: null,
          modelId: null,
          resolvedModel: null,
          inputTokens: null,
          outputTokens: null,
        }),
        {
          sessionId: "current-chat-session",
          sessionTitle: "Correct storage title",
          sessionCreatedAt: "2026-07-01T15:10:00.000Z",
        },
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
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

  test("Task history resolver distinguishes branch defaults from explicit no-task clears", () => {
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
        branch: null,
        defaultTask: null,
        selectedTask: null,
      },
    );
    assert.strictEqual(resolver(createOtelTaskRequest(null)), null);
  });

  test("Task history records task clears and finds latest entries per workspace", () => {
    const previous = createWorkspaceContext({
      branch: "feature/123-login",
      defaultTask: "123",
      selectedTask: "999",
    });
    const cleared = createWorkspaceContext({
      branch: "main",
      defaultTask: null,
      selectedTask: null,
    });
    const latest = createTaskHistoryEntry({
      branch: "feature/123-login",
      defaultTask: "123",
      selectedTask: "999",
    });

    assert.strictEqual(
      shouldRecordTaskHistoryEntry(previous, cleared, latest),
      true,
    );
    assert.strictEqual(
      shouldRecordTaskHistoryEntry(undefined, cleared, undefined),
      false,
    );
    assert.strictEqual(
      shouldRecordTaskHistoryEntry(undefined, cleared, {
        ...latest,
        workspaceId: "other-workspace",
      }),
      false,
    );
    assert.strictEqual(
      shouldRecordTaskHistoryEntry(undefined, cleared, latest),
      true,
    );
    assert.deepStrictEqual(
      latestTaskHistoryForWorkspace(
        [
          createTaskHistoryEntry({
            workspaceId: "other-workspace",
            selectedTask: "other",
            timestamp: "2026-07-01T00:20:00.000Z",
          }),
          latest,
          createTaskHistoryEntry({
            selectedTask: null,
            timestamp: "2026-07-01T00:30:00.000Z",
          }),
        ],
        "workspace-id",
      )?.selectedTask,
      null,
    );
  });

  test("Branch task prompts are scoped by workspace and skip repeated or unnecessary prompts", () => {
    const previous = createWorkspaceContext({
      branch: "feature/123-login",
      defaultTask: "123",
      selectedTask: "999",
      workspaceId: "workspace-a",
    });
    const next = createWorkspaceContext({
      branch: "feature/456-api",
      defaultTask: "456",
      selectedTask: "999",
      workspaceId: "workspace-a",
    });
    const prompt = branchTaskSwitchPrompt(previous, next, undefined);

    assert.deepStrictEqual(prompt, {
      promptKey: "workspace-a:feature/123-login->feature/456-api:456",
      task: "456",
    });
    assert.strictEqual(
      branchTaskSwitchPrompt(previous, next, prompt?.promptKey),
      null,
    );
    assert.deepStrictEqual(
      branchTaskSwitchPrompt(
        { ...previous, workspaceId: "workspace-b" },
        { ...next, workspaceId: "workspace-b" },
        prompt?.promptKey,
      ),
      {
        promptKey: "workspace-b:feature/123-login->feature/456-api:456",
        task: "456",
      },
    );
    assert.strictEqual(
      branchTaskSwitchPrompt(
        previous,
        { ...next, selectedTask: "456" },
        undefined,
      ),
      null,
    );
    assert.strictEqual(
      branchTaskSwitchPrompt(
        previous,
        { ...next, defaultTask: null },
        undefined,
      ),
      null,
    );
  });

  test("Task branch switch settings match base branches case-insensitively", () => {
    assert.deepStrictEqual(
      normalizeTaskBranchBaseBranches([" main ", "DEV", ""]),
      ["main", "DEV"],
    );
    assert.deepStrictEqual(
      normalizeTaskBranchBaseBranches("not-an-array"),
      defaultTaskBranchBaseBranches,
    );
    assert.strictEqual(
      isTaskBranchBaseBranch("Main", ["main", "dev", "beta"]),
      true,
    );
    assert.strictEqual(
      isTaskBranchBaseBranch("feature/123-login", ["main", "dev", "beta"]),
      false,
    );
    assert.strictEqual(normalizeTaskBranchNamePrefix("ticket/"), "");
    assert.strictEqual(normalizeTaskBranchNamePrefix(" feature/ "), "feature/");
  });

  test("Task branch switch parses and ranks local and remote refs for task lookup", () => {
    const branches = parseGitBranchRefs(
      [
        "refs/remotes/origin/HEAD",
        "refs/remotes/origin/task/16648",
        "refs/remotes/upstream/task/16648",
        "refs/remotes/origin/feature/16648-login",
        "refs/heads/task/16648",
        "refs/heads/task/99999",
      ].join("\n"),
    );

    assert.deepStrictEqual(
      branches.map((branch) => ({
        branchName: branch.branchName,
        refName: branch.refName,
        kind: branch.kind,
      })),
      [
        {
          branchName: "task/16648",
          refName: "refs/heads/task/16648",
          kind: "local",
        },
        {
          branchName: "task/99999",
          refName: "refs/heads/task/99999",
          kind: "local",
        },
        {
          branchName: "feature/16648-login",
          refName: "refs/remotes/origin/feature/16648-login",
          kind: "remote",
        },
      ],
    );
  });

  test("Task branch switch suggests and validates branch names", () => {
    assert.strictEqual(
      suggestedTaskBranchName("16648", defaultTaskBranchNamePrefix),
      "16648",
    );
    assert.strictEqual(suggestedTaskBranchName("16648", "task/"), "task/16648");
    assert.strictEqual(
      suggestedTaskBranchName("ABC 123: Fix Login", "feature/"),
      "feature/abc-123-fix-login",
    );
    assert.strictEqual(validateTaskBranchName("task/16648"), null);
    assert.strictEqual(
      validateTaskBranchName("task has spaces"),
      "Use a valid Git branch name.",
    );
  });

  test("Normalizes repository remotes across HTTPS and SSH forms", () => {
    assert.strictEqual(
      normalizeRepositoryRemoteUrl("git@github.com:Owner/Repo.git"),
      "https://github.com/owner/repo",
    );
    assert.strictEqual(
      normalizeRepositoryRemoteUrl("https://github.com/owner/repo"),
      "https://github.com/owner/repo",
    );
    assert.strictEqual(
      normalizeRepositoryRemoteUrl(
        "git@ssh.dev.azure.com:v3/Org/Project/Repo.git",
      ),
      "https://dev.azure.com/org/project/_git/repo",
    );
    assert.strictEqual(
      normalizeRepositoryRemoteUrl(
        "https://Org@dev.azure.com/Org/Project/_git/Repo.git",
      ),
      "https://dev.azure.com/org/project/_git/repo",
    );
  });

  test("Filters OTel requests by normalized Azure DevOps repository remotes", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        `${JSON.stringify(
          createResourceSpanRecord([
            {
              traceId: "trace-azure-ssh",
              spanId: "span-azure-ssh",
              name: "invoke_agent copilot",
              startTimeUnixNano: "1782638400000000000",
              endTimeUnixNano: "1782638410000000000",
              attributes: attributes({
                "gen_ai.operation.name": "invoke_agent",
                "gen_ai.agent.name": "GitHub Copilot Chat",
                "gen_ai.conversation.id": "session-azure-ssh",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 11,
                "gen_ai.usage.output_tokens": 13,
                "github.copilot.git.repository":
                  "git@ssh.dev.azure.com:v3/ExampleOrg/ExampleProject/CopilotTracker.git",
                "github.copilot.git.branch": "feature/456-api",
              }),
            },
            {
              traceId: "trace-other-repo",
              spanId: "span-other-repo",
              name: "invoke_agent copilot",
              startTimeUnixNano: "1782638420000000000",
              endTimeUnixNano: "1782638430000000000",
              attributes: attributes({
                "gen_ai.operation.name": "invoke_agent",
                "gen_ai.agent.name": "GitHub Copilot Chat",
                "gen_ai.conversation.id": "session-other-repo",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 17,
                "gen_ai.usage.output_tokens": 19,
                "github.copilot.git.repository":
                  "https://dev.azure.com/exampleorg/exampleproject/_git/OtherRepo",
                "github.copilot.git.branch": "feature/999-other",
              }),
            },
          ]),
        )}\n`,
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext({
          repositoryRemoteUrl:
            "https://dev.azure.com/exampleorg/exampleproject/_git/copilottracker",
        }),
        otelFilePath,
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0]?.requestId, "trace-azure-ssh");
      assert.strictEqual(requests[0]?.sessionId, "session-azure-ssh");
      assert.strictEqual(
        requests[0]?.repositoryRemoteUrl,
        "git@ssh.dev.azure.com:v3/ExampleOrg/ExampleProject/CopilotTracker.git",
      );
      assert.strictEqual(requests[0]?.branch, "feature/456-api");
      assert.strictEqual(requests[0]?.inputTokens, 11);
      assert.strictEqual(requests[0]?.outputTokens, 13);
      assert.strictEqual(requests[0]?.totalTokens, 24);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Decodes OTLP HTTP protobuf logs into Copilot requests", () => {
    const encoded = encodeOtlpHttpPayload("logs", createOtlpLogExport());
    const decoded = decodeOtlpHttpPayload(
      "logs",
      encoded,
      "application/x-protobuf",
    );
    const requests = readCopilotOtelRequestsFromRecords(
      createWorkspaceContext(),
      [decoded],
    );

    assert.strictEqual(requests.length, 1);
    assert.strictEqual(
      requests[0]?.requestRecordId,
      "otel-log:1234567890abcdef1234567890abcdef:http-response-1",
    );
    assert.strictEqual(requests[0]?.requestId, "1234567890abcdef1234567890abcdef");
    assert.strictEqual(requests[0]?.responseId, "http-response-1");
    assert.strictEqual(requests[0]?.sessionId, "http-chat-session");
    assert.strictEqual(requests[0]?.modelId, "gpt-5-nano");
    assert.strictEqual(requests[0]?.inputTokens, 321);
    assert.strictEqual(requests[0]?.outputTokens, 123);
    assert.strictEqual(requests[0]?.totalTokens, 444);
  });

  test("Receives OTLP HTTP protobuf logs on the local receiver", async () => {
    const received: unknown[] = [];
    const receiver = await startOtlpHttpReceiver((records) => {
      received.push(...records);
    });

    try {
      const encoded = encodeOtlpHttpPayload("logs", createOtlpLogExport());
      const response = await fetch(`${receiver.endpoint}/v1/logs`, {
        method: "POST",
        headers: { "content-type": "application/x-protobuf" },
        body: Buffer.from(encoded),
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(
        response.headers.get("content-type"),
        "application/x-protobuf",
      );
      assert.strictEqual(received.length, 1);
      const requests = readCopilotOtelRequestsFromRecords(
        createWorkspaceContext(),
        received,
      );
      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0]?.totalTokens, 444);
    } finally {
      receiver.dispose();
    }
  });

  test("Rejects a second OTLP receiver on the same port", async () => {
    const first = await startOtlpHttpReceiver(() => {});
    const port = Number(new URL(first.endpoint).port);
    try {
      await assert.rejects(
        startOtlpHttpReceiver(() => {}, port),
        (error: NodeJS.ErrnoException) => error.code === "EADDRINUSE",
      );
    } finally {
      first.dispose();
    }
  });

  test("Spools received OTLP records and reads them back for any window", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "otlp-spool-"));
    const spoolPath = otlpSpoolPath(path.join(tempDir, "global-storage"));
    try {
      const decoded = decodeOtlpHttpPayload(
        "logs",
        encodeOtlpHttpPayload("logs", createOtlpLogExport()),
        "application/x-protobuf",
      );
      await appendOtlpSpoolRecords(spoolPath, [decoded], "logs");

      const spooled = await readOtlpSpoolRecords(spoolPath, 5_000);
      assert.strictEqual(spooled.length, 1);
      assert.strictEqual(spooled[0]?.signal, "logs");

      const requests = readCopilotOtelRequestsFromRecords(
        createWorkspaceContext(),
        spooled.map((entry) => entry.record),
      );
      assert.strictEqual(requests.length, 1);
      assert.strictEqual(requests[0]?.totalTokens, 444);

      const spoolStat = await statOtlpSpool(spoolPath);
      assert.ok(spoolStat && spoolStat.sizeBytes > 0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Skips corrupt spool lines and caps how many records are read", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "otlp-spool-"));
    const spoolPath = otlpSpoolPath(tempDir);
    try {
      await appendOtlpSpoolRecords(spoolPath, [{ index: 1 }, { index: 2 }], "logs");
      await appendFile(spoolPath, '{"receivedAt":"2026-07-03T00:00:00.000Z","si\n');
      await appendOtlpSpoolRecords(spoolPath, [{ index: 3 }], "traces");

      const allRecords = await readOtlpSpoolRecords(spoolPath, 5_000);
      assert.deepStrictEqual(
        allRecords.map((entry) => entry.record),
        [{ index: 1 }, { index: 2 }, { index: 3 }],
      );

      const cappedRecords = await readOtlpSpoolRecords(spoolPath, 2);
      assert.deepStrictEqual(
        cappedRecords.map((entry) => entry.record),
        [{ index: 2 }, { index: 3 }],
      );

      assert.deepStrictEqual(await readOtlpSpoolRecords(
        path.join(tempDir, "missing.jsonl"),
        5_000,
      ), []);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Compacts the spool once it grows past the byte cap", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "otlp-spool-"));
    const spoolPath = otlpSpoolPath(tempDir);
    try {
      const records = Array.from({ length: 50 }, (_, index) => ({
        index,
        padding: "x".repeat(100),
      }));
      await appendOtlpSpoolRecords(spoolPath, records, "logs", {
        maxSpoolBytes: 1_000,
        compactKeepRecords: 5,
      });

      const kept = await readOtlpSpoolRecords(spoolPath, 5_000);
      assert.strictEqual(kept.length, 5);
      assert.deepStrictEqual(
        kept.map((entry) => (entry.record as { index: number }).index),
        [45, 46, 47, 48, 49],
      );
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Preserves diagnostic paths while redacting credentials from structured logs", () => {
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

    assert.match(
      formatted,
      /"workspacePath": "\/Users\/example\/private-project"/,
    );
    assert.match(
      formatted,
      /"repositoryRoot": "\/Users\/example\/private-project"/,
    );
    assert.match(
      formatted,
      /"repositoryRemoteUrl": "https:\/\/example\.com\/private-org\/private-project\.git"/,
    );
    assert.match(
      formatted,
      /"file": "\/Users\/example\/private-project\/\.vscode\/state\.json"/,
    );
    assert.match(
      formatted,
      /"storagePath": "\/Users\/example\/Library\/Application Support\/Code"/,
    );
    assert.match(formatted, /"accessToken": "\[redacted\]"/);
    assert.match(formatted, /"branch": "feature\/123-login"/);
    assert.match(formatted, /"requestCount": 3/);
    assert.match(formatted, /\/Users\/example/);
    assert.match(formatted, /private-org/);
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

    const localWorkspaceMetadataPlan = planRequestUpload(
      [
        createChatRequest({
          requestRecordId: "otel:trace-cache-1",
          capturedAt: "2026-07-01T00:06:00.000Z",
          workspaceFolderPaths: [
            "/tmp/copilot-tracker",
            "/tmp/copilot-tracker-api",
          ],
          workspaceFilePath: "/tmp/copilot-tracker.code-workspace",
        }),
      ],
      firstPlan.nextState,
    );

    assert.strictEqual(localWorkspaceMetadataPlan.requestsToUpload.length, 0);
    assert.strictEqual(
      localWorkspaceMetadataPlan.skippedUnchangedRequestCount,
      1,
    );

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
              tags: "auth; urgent",
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
              tags: "auth; urgent",
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
              tags: null,
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
              tags: null,
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
              tags: null,
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

  test("Work item quick pick rows show type metadata and Azure open buttons", () => {
    const item = workItemQuickPickItem(
      createAzureWorkItem({
        id: 17198,
        title: "File deletion confirmation popup needs adjustment",
        type: "Task",
        state: "Waiting for Deployment",
        project: "Tracker",
        assignedTo: "A Person",
        tags: "ux;qa",
        url: "https://dev.azure.com/example/project/_workitems/edit/17198",
      }),
    );

    assert.strictEqual(
      item.label,
      "$(checklist) 17198: File deletion confirmation popup needs adjustment",
    );
    assert.strictEqual(
      item.description,
      "Task / Waiting for Deployment / Tracker",
    );
    assert.strictEqual(item.detail, "Assigned to A Person | Tags: ux;qa");
    assert.strictEqual(item.taskId, "17198");
    assert.strictEqual(
      item.workItemUrl,
      "https://dev.azure.com/example/project/_workitems/edit/17198",
    );
    assert.strictEqual(item.buttons?.[0]?.tooltip, "Open in Azure DevOps");
  });

  test("Work item quick pick rows mark current repository project matches", () => {
    const item = workItemQuickPickItem(
      createAzureWorkItem({
        id: 17198,
        project: "Tracker",
        assignedTo: "A Person",
      }),
      { currentProject: "tracker" },
    );

    assert.strictEqual(
      item.detail,
      "Current repo project | Assigned to A Person",
    );
  });

  test("Work item quick pick rows ignore unsafe open URLs", () => {
    const item = workItemQuickPickItem(
      createAzureWorkItem({
        id: 1,
        url: "javascript:alert(1)",
      }),
    );

    assert.strictEqual(item.workItemUrl, undefined);
    assert.strictEqual(item.buttons, undefined);
  });

  test("Work item quick pick sorts terminal states after active results", () => {
    const completed = createAzureWorkItem({ id: 1, state: "Completed" });
    const active = createAzureWorkItem({ id: 2, state: "Active" });
    const accepted = createAzureWorkItem({ id: 3, state: "Accepted" });
    const proposed = createAzureWorkItem({ id: 4, state: "Proposed" });

    assert.deepStrictEqual(
      sortWorkItemsForQuickPick([completed, active, accepted, proposed]).map(
        (item) => item.id,
      ),
      [2, 4, 1, 3],
    );
    assert.strictEqual(isTerminalWorkItemState("Accepted"), true);
    assert.strictEqual(isTerminalWorkItemState("Active"), false);
  });

  test("Work item quick pick ranks exact id, current project, and recency", () => {
    const sameProjectOlder = createAzureWorkItem({
      id: 1,
      project: "Tracker",
      state: "Active",
      changedAt: "2026-01-01T00:00:00.000Z",
    });
    const sameProjectNewer = createAzureWorkItem({
      id: 2,
      project: "Tracker",
      state: "Active",
      changedAt: "2026-07-01T00:00:00.000Z",
    });
    const otherProjectNewer = createAzureWorkItem({
      id: 3,
      project: "Other",
      state: "Active",
      changedAt: "2026-07-02T00:00:00.000Z",
    });
    const sameProjectCompleted = createAzureWorkItem({
      id: 4,
      project: "Tracker",
      state: "Completed",
      changedAt: "2026-07-03T00:00:00.000Z",
    });
    const context = {
      query: "tracker",
      repositoryRemoteUrl: "git@ssh.dev.azure.com:v3/Org/Tracker/Repo.git",
    };

    assert.deepStrictEqual(
      sortWorkItemsForQuickPick(
        [
          sameProjectCompleted,
          otherProjectNewer,
          sameProjectOlder,
          sameProjectNewer,
        ],
        context,
      ).map((item) => item.id),
      [2, 1, 4, 3],
    );
    assert.strictEqual(
      sortWorkItemsForQuickPick(
        [sameProjectNewer, sameProjectCompleted],
        { ...context, query: "4" },
      )[0]?.id,
      4,
    );
  });

  test("Work item quick pick extracts Azure DevOps project names from remotes", () => {
    assert.strictEqual(
      azureDevOpsProjectFromRemoteUrl(
        "git@ssh.dev.azure.com:v3/Org/My Project/Repo.git",
      ),
      "my project",
    );
    assert.strictEqual(
      azureDevOpsProjectFromRemoteUrl(
        "https://Org@dev.azure.com/Org/Tracker/_git/Repo.git",
      ),
      "tracker",
    );
    assert.strictEqual(
      azureDevOpsProjectFromRemoteUrl(
        "https://org.visualstudio.com/Tracker/_git/Repo",
      ),
      "tracker",
    );
    assert.strictEqual(
      azureDevOpsProjectFromRemoteUrl("https://github.com/owner/repo"),
      null,
    );
  });

  test("Work item quick pick maps common Azure work item types to icons", () => {
    assert.strictEqual(workItemTypeCodicon("Bug"), "bug");
    assert.strictEqual(workItemTypeCodicon("User Story"), "book");
    assert.strictEqual(workItemTypeCodicon("Feature"), "flag");
    assert.strictEqual(workItemTypeCodicon("Task"), "checklist");
    assert.strictEqual(workItemTypeCodicon("Test Case"), "beaker");
    assert.strictEqual(workItemTypeCodicon("Unknown"), "issues");
    assert.strictEqual(
      safeWorkItemUrl("https://dev.azure.com/example/project/_workitems/edit/1"),
      "https://dev.azure.com/example/project/_workitems/edit/1",
    );
    assert.strictEqual(safeWorkItemUrl("not a url"), null);
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

  test("Applies historical task assignments to OTel requests by timestamp", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        `${JSON.stringify(
          createResourceSpanRecord([
            {
              traceId: "trace-history-before-clear",
              spanId: "span-history-before-clear",
              name: "invoke_agent copilot",
              startTimeUnixNano: "1782638400000000000",
              endTimeUnixNano: "1782638401000000000",
              attributes: attributes({
                "gen_ai.operation.name": "invoke_agent",
                "gen_ai.agent.name": "GitHub Copilot Chat",
                "gen_ai.conversation.id": "session-history",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 3,
                "gen_ai.usage.output_tokens": 5,
                "github.copilot.git.repository":
                  "https://github.com/Antoni-Czaplicki/copilot-tracker.git",
                "github.copilot.git.branch": "raw/otel-branch",
              }),
            },
            {
              traceId: "trace-history-override",
              spanId: "span-history-override",
              name: "invoke_agent copilot",
              startTimeUnixNano: "1782639000000000000",
              endTimeUnixNano: "1782639001000000000",
              attributes: attributes({
                "gen_ai.operation.name": "invoke_agent",
                "gen_ai.agent.name": "GitHub Copilot Chat",
                "gen_ai.conversation.id": "session-history",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 7,
                "gen_ai.usage.output_tokens": 11,
                "github.copilot.git.repository":
                  "https://github.com/Antoni-Czaplicki/copilot-tracker.git",
                "github.copilot.git.branch": "raw/otel-branch",
              }),
            },
            {
              traceId: "trace-history-clear",
              spanId: "span-history-clear",
              name: "invoke_agent copilot",
              startTimeUnixNano: "1782639600000000000",
              endTimeUnixNano: "1782639601000000000",
              attributes: attributes({
                "gen_ai.operation.name": "invoke_agent",
                "gen_ai.agent.name": "GitHub Copilot Chat",
                "gen_ai.conversation.id": "session-history",
                "gen_ai.request.model": "openai/OpenAI/gpt-5-nano",
                "gen_ai.response.model": "gpt-5-nano",
                "gen_ai.usage.input_tokens": 13,
                "gen_ai.usage.output_tokens": 17,
                "github.copilot.git.repository":
                  "https://github.com/Antoni-Czaplicki/copilot-tracker.git",
                "github.copilot.git.branch": "raw/otel-branch",
              }),
            },
          ]),
        )}\n`,
      );

      const workspaceContext = createWorkspaceContext();
      const requests = await readCopilotOtelRequests(
        workspaceContext,
        otelFilePath,
        createTaskResolverFromHistory(
          [
            createTaskHistoryEntry({
              timestamp: "2026-06-28T09:00:00.000Z",
              branch: "feature/123-login",
              defaultTask: "123",
              selectedTask: "123",
            }),
            createTaskHistoryEntry({
              timestamp: "2026-06-28T09:25:00.000Z",
              branch: "feature/456-api",
              defaultTask: "456",
              selectedTask: "789",
            }),
            createTaskHistoryEntry({
              timestamp: "2026-06-28T09:35:00.000Z",
              branch: null,
              defaultTask: null,
              selectedTask: null,
            }),
          ],
          workspaceContext,
        ),
      );

      assert.deepStrictEqual(
        requests.map((request) => ({
          requestId: request.requestId,
          branch: request.branch,
          defaultTask: request.defaultTask,
          selectedTask: request.selectedTask,
          totalTokens: request.totalTokens,
        })),
        [
          {
            requestId: "trace-history-before-clear",
            branch: "feature/123-login",
            defaultTask: "123",
            selectedTask: "123",
            totalTokens: 8,
          },
          {
            requestId: "trace-history-override",
            branch: "feature/456-api",
            defaultTask: "456",
            selectedTask: "789",
            totalTokens: 18,
          },
          {
            requestId: "trace-history-clear",
            branch: null,
            defaultTask: null,
            selectedTask: null,
            totalTokens: 30,
          },
        ],
      );
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

  test("Accepts repo-less OTel log records when matched to this workspace chat session", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        [
          createPlainLogRecord({
            traceId: "trace-repoless-1",
            spanId: "span-repoless-1",
            hrTime: [1782918561, 664000000],
            body: "copilot_chat.session.start",
            resourceSessionId: "otel-window-session",
            includeRepository: false,
            attributes: {
              "event.name": "copilot_chat.session.start",
              "session.id": "otel-chat-session",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.agent.name": "GitHub Copilot Chat",
            },
          }),
          createPlainLogRecord({
            traceId: "trace-repoless-1",
            spanId: "span-repoless-1",
            hrTime: [1782918567, 664000000],
            body: "GenAI inference: gpt-5-nano",
            resourceSessionId: "otel-window-session",
            includeRepository: false,
            attributes: {
              "event.name": "gen_ai.client.inference.operation.details",
              "gen_ai.operation.name": "chat",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.response.model": "gpt-5-nano-2025-08-07",
              "gen_ai.response.id": "response-repoless-1",
              "gen_ai.usage.input_tokens": 22375,
              "gen_ai.usage.output_tokens": 471,
            },
          }),
        ]
          .map((record) => JSON.stringify(record))
          .join("\n"),
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext(),
        otelFilePath,
        undefined,
        (request) =>
          request.traceId === "trace-repoless-1"
            ? {
                sessionId: "otel-chat-session",
                sessionTitle: "For Copilot Tracker QA after clearing the task",
                sessionCreatedAt: "2026-07-01T15:09:21.664Z",
              }
            : null,
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(
        requests[0]?.requestRecordId,
        "otel-log:trace-repoless-1:response-repoless-1",
      );
      assert.strictEqual(requests[0]?.sessionId, "otel-chat-session");
      assert.strictEqual(
        requests[0]?.sessionTitle,
        "For Copilot Tracker QA after clearing the task",
      );
      assert.strictEqual(requests[0]?.inputTokens, 22375);
      assert.strictEqual(requests[0]?.outputTokens, 471);
      assert.strictEqual(requests[0]?.branch, "main");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Rejects repo-less OTel log records without a workspace chat session match", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        JSON.stringify(
          createPlainLogRecord({
            traceId: "trace-repoless-unmatched",
            spanId: "span-repoless-unmatched",
            hrTime: [1782918567, 664000000],
            body: "GenAI inference: gpt-5-nano",
            resourceSessionId: "otel-window-session",
            includeRepository: false,
            attributes: {
              "event.name": "gen_ai.client.inference.operation.details",
              "gen_ai.operation.name": "chat",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.response.model": "gpt-5-nano-2025-08-07",
              "gen_ai.response.id": "response-repoless-unmatched",
              "gen_ai.usage.input_tokens": 100,
              "gen_ai.usage.output_tokens": 20,
            },
          }),
        ),
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext(),
        otelFilePath,
      );

      assert.strictEqual(requests.length, 0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Accepts repo-less Copilot Chat session logs without a title match", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        [
          createPlainLogRecord({
            traceId: "trace-repoless-copilot-session",
            spanId: "span-repoless-copilot-session",
            hrTime: [1782919311, 505000000],
            body: "copilot_chat.session.start",
            resourceSessionId: "otel-window-session",
            includeRepository: false,
            attributes: {
              "event.name": "copilot_chat.session.start",
              "session.id": "windows-chat-session",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.agent.name": "GitHub Copilot Chat",
            },
          }),
          createPlainLogRecord({
            traceId: "trace-repoless-copilot-session",
            spanId: "span-repoless-copilot-session",
            hrTime: [1782919315, 664000000],
            body: "GenAI inference: gpt-5-nano",
            resourceSessionId: "otel-window-session",
            includeRepository: false,
            attributes: {
              "event.name": "gen_ai.client.inference.operation.details",
              "gen_ai.operation.name": "chat",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.response.model": "gpt-5-nano-2025-08-07",
              "gen_ai.response.id": "response-repoless-copilot-session",
              "gen_ai.usage.input_tokens": 1100,
              "gen_ai.usage.output_tokens": 300,
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
        "otel-log:trace-repoless-copilot-session:response-repoless-copilot-session",
      );
      assert.strictEqual(requests[0]?.sessionId, "windows-chat-session");
      assert.strictEqual(
        requests[0]?.sessionTitle,
        "copilot-tracker - main - gpt-5-nano",
      );
      assert.strictEqual(requests[0]?.inputTokens, 1100);
      assert.strictEqual(requests[0]?.outputTokens, 300);
      assert.strictEqual(requests[0]?.totalTokens, 1400);
      assert.strictEqual(requests[0]?.branch, "main");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("Accepts repo-less Copilot Chat logs with a timestamp-matched workspace session", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "copilot-otel-"));

    try {
      const otelFilePath = path.join(tempDir, "copilot-otel.jsonl");
      await writeFile(
        otelFilePath,
        [
          createPlainLogRecord({
            traceId: "trace-repoless-other-session",
            spanId: "span-repoless-other-session",
            hrTime: [1782919251, 505000000],
            body: "copilot_chat.session.start",
            resourceSessionId: "otel-window-session",
            includeRepository: false,
            attributes: {
              "event.name": "copilot_chat.session.start",
              "session.id": "workspace-a-chat-session",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.agent.name": "GitHub Copilot Chat",
            },
          }),
          createPlainLogRecord({
            traceId: "trace-repoless-other-session",
            spanId: "span-repoless-other-session",
            hrTime: [1782919255, 664000000],
            body: "GenAI inference: gpt-5-nano",
            resourceSessionId: "otel-window-session",
            includeRepository: false,
            attributes: {
              "event.name": "gen_ai.client.inference.operation.details",
              "gen_ai.operation.name": "chat",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.response.model": "gpt-5-nano-2025-08-07",
              "gen_ai.response.id": "response-repoless-other-session",
              "gen_ai.usage.input_tokens": 722,
              "gen_ai.usage.output_tokens": 305,
            },
          }),
          createPlainLogRecord({
            traceId: "trace-repoless-other-session",
            spanId: "span-repoless-other-session",
            hrTime: [1782919256, 664000000],
            body: "GenAI inference: gpt-5-nano",
            resourceSessionId: "otel-window-session",
            includeRepository: false,
            attributes: {
              "event.name": "gen_ai.client.inference.operation.details",
              "gen_ai.operation.name": "chat",
              "gen_ai.request.model": "gpt-5-nano",
              "gen_ai.response.model": "gpt-5-nano-2025-08-07",
              "gen_ai.response.id": "response-repoless-other-session",
              "gen_ai.usage.input_tokens": 900,
              "gen_ai.usage.output_tokens": 305,
            },
          }),
        ]
          .map((record) => JSON.stringify(record))
          .join("\n"),
      );

      const requests = await readCopilotOtelRequests(
        createWorkspaceContext(),
        otelFilePath,
        undefined,
        () => ({
          sessionId: "workspace-b-chat-session",
          sessionTitle: "Nearby request in this VS Code workspace",
          sessionCreatedAt: "2026-07-01T15:20:51.505Z",
        }),
      );

      assert.strictEqual(requests.length, 1);
      assert.strictEqual(
        requests[0]?.requestRecordId,
        "otel-log:trace-repoless-other-session:response-repoless-other-session",
      );
      assert.strictEqual(requests[0]?.sessionId, "workspace-a-chat-session");
      assert.strictEqual(
        requests[0]?.sessionTitle,
        "Nearby request in this VS Code workspace",
      );
      assert.strictEqual(requests[0]?.inputTokens, 900);
      assert.strictEqual(requests[0]?.outputTokens, 305);
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
    workspaceFolderPaths: ["/tmp/copilot-tracker"],
    workspaceFilePath: null,
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

function createOtlpLogExport() {
  const traceId = hexBytes("1234567890abcdef1234567890abcdef");
  const spanId = hexBytes("fedcba0987654321");
  return {
    resourceLogs: [
      {
        resource: {
          attributes: [
            otlpString("service.name", "copilot-chat"),
            otlpString("session.id", "otel-window-session"),
          ],
        },
        scopeLogs: [
          {
            logRecords: [
              {
                timeUnixNano: "1782918561000000000",
                traceId,
                spanId,
                body: { stringValue: "copilot_chat.session.start" },
                attributes: [
                  otlpString("event.name", "copilot_chat.session.start"),
                  otlpString("session.id", "http-chat-session"),
                  otlpString("gen_ai.request.model", "gpt-5-nano"),
                  otlpString("gen_ai.agent.name", "GitHub Copilot Chat"),
                ],
              },
              {
                timeUnixNano: "1782918567000000000",
                traceId,
                spanId,
                body: { stringValue: "GenAI inference: gpt-5-nano" },
                attributes: [
                  otlpString(
                    "event.name",
                    "gen_ai.client.inference.operation.details",
                  ),
                  otlpString("gen_ai.operation.name", "chat"),
                  otlpString("gen_ai.request.model", "gpt-5-nano"),
                  otlpString("gen_ai.response.model", "gpt-5-nano-2025-08-07"),
                  otlpString("gen_ai.response.id", "http-response-1"),
                  otlpInt("gen_ai.usage.input_tokens", 321),
                  otlpInt("gen_ai.usage.output_tokens", 123),
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

function otlpString(key: string, value: string) {
  return { key, value: { stringValue: value } };
}

function otlpInt(key: string, value: number) {
  return { key, value: { intValue: String(value) } };
}

function hexBytes(value: string) {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 2) {
    bytes.push(Number.parseInt(value.slice(index, index + 2), 16));
  }
  return bytes;
}

async function writeStateDb(pathValue: string, indexValue: unknown) {
  const { DatabaseSync } = await import("node:sqlite");
  const database = new DatabaseSync(pathValue);
  try {
    database.exec("CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value TEXT);");
    database
      .prepare("INSERT INTO ItemTable (key, value) VALUES (?, ?);")
      .run("chat.ChatSessionStore.index", JSON.stringify(indexValue));
  } finally {
    database.close();
  }
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
  overrides: Partial<CopilotChatRequest> & {
    workspaceFolderPaths?: string[];
    workspaceFilePath?: string | null;
  } = {},
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

function createTrackerConfigurationSource({
  globalValues = {},
  workspaceValues = {},
}: {
  globalValues?: Record<string, unknown>;
  workspaceValues?: Record<string, unknown>;
} = {}): TrackerConfigurationSource {
  return {
    inspect: <T>(section: string) =>
      ({
        key: `copilot-tracker.${section}`,
        globalValue: globalValues[section] as T | undefined,
        workspaceValue: workspaceValues[section] as T | undefined,
      }) as TrackerConfigurationInspect<T> & { workspaceValue?: T },
    get: <T>(section: string, defaultValue: T) =>
      (workspaceValues[section] ?? globalValues[section] ?? defaultValue) as T,
  };
}

async function readCopilotOtelRequests(
  workspaceContext: Parameters<typeof readCopilotOtelRequestsFromRecords>[0],
  otelFilePath: string,
  resolveTaskForRequest?: Parameters<typeof readCopilotOtelRequestsFromRecords>[2],
  resolveSessionForRequest?: Parameters<
    typeof readCopilotOtelRequestsFromRecords
  >[3],
) {
  const text = await readFile(otelFilePath, "utf8");
  const records = text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as unknown);
  return readCopilotOtelRequestsFromRecords(
    workspaceContext,
    records,
    resolveTaskForRequest,
    resolveSessionForRequest,
  );
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

function createAzureWorkItem(
  overrides: Partial<AzureDevOpsWorkItem> & Pick<AzureDevOpsWorkItem, "id">,
): AzureDevOpsWorkItem {
  return {
    id: overrides.id,
    title: overrides.title ?? `Task ${overrides.id}`,
    state: overrides.state ?? null,
    type: overrides.type ?? null,
    project: overrides.project ?? null,
    assignedTo: overrides.assignedTo ?? null,
    changedAt: overrides.changedAt ?? null,
    tags: overrides.tags ?? null,
    url: overrides.url ?? null,
  };
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
  includeRepository = true,
  attributes: recordAttributes,
}: {
  traceId: string;
  spanId: string;
  hrTime: [number, number];
  body: string;
  resourceSessionId: string;
  includeRepository?: boolean;
  attributes: Record<string, unknown>;
}) {
  const resourceAttributes: [string, string][] = [
    ["service.name", "copilot-chat"],
    ["service.version", "0.54.0"],
    ["session.id", resourceSessionId],
  ];
  if (includeRepository) {
    resourceAttributes.push([
      "github.copilot.git.repository",
      "https://github.com/Antoni-Czaplicki/copilot-tracker.git",
    ]);
  }

  return {
    hrTime,
    hrTimeObserved: hrTime,
    spanContext: {
      traceId,
      spanId,
      traceFlags: 1,
    },
    resource: {
      _rawAttributes: resourceAttributes,
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
