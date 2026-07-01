import * as vscode from "vscode";

import { branchTaskSwitchPrompt } from "./branchTaskPrompt";
import {
  createChatSessionTitleResolver,
  getDefaultWorkspaceStorageRoot,
} from "./chatSessionTitles";
import { trackerDashboardUrl } from "./dashboardUrl";
import {
  initializeLogger,
  logError,
  logInfo,
  logWarn,
  showLogs,
} from "./logger";
import {
  type RequestTaskResolver,
  createOtelFileWatcher,
  ensureCopilotOtelConfiguration,
  getLastCopilotOtelConfigurationWriteAt,
  getOtelFileSignature,
  readCopilotOtelRequests,
  resolveOtelFilePath,
} from "./otel";
import {
  planRequestUpload,
  readRequestUploadState,
  writeRequestUploadState,
} from "./requestUploadCache";
import {
  type SessionTokenStats,
  currentSessionTokenStats,
} from "./sessionTokenStats";
import { SingleFlightTaskQueue } from "./singleFlightTaskQueue";
import {
  compactStatusText,
  formatCompactNumber,
  formatEstimatedSessionCost,
  formatNumber,
} from "./statusFormatting";
import {
  type TaskHistoryEntry,
  createTaskResolverFromHistory,
  getTaskHistorySource,
  latestTaskHistoryForWorkspace,
  readTaskHistoryFromValue,
  shouldRecordTaskHistoryEntry,
} from "./taskHistory";
import {
  type AzureDevOpsWorkItem,
  TrackerClient,
  getTrackerConfig,
  parseTrackerServerUrl,
} from "./trackerClient";
import {
  type CopilotChatRequest,
  TrackerEvent,
  TrackerEventType,
  WorkspaceContext,
} from "./types";
import { buildWorkspaceContext, setSelectedTask } from "./workspaceContext";

const extensionId = "copilot-tracker";
const lastBranchPromptKey = "lastBranchPrompt";
const taskHistoryKey = "taskHistory";
const maxTaskHistoryEntries = 200;

let statusItem: vscode.StatusBarItem;
let sessionTokenStatusItem: vscode.StatusBarItem;
let currentWorkspaceContext: WorkspaceContext | undefined;
let lastOtelSignature: string | undefined;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let lastSyncStats = { requestCount: 0, tokenCount: 0, missingTokenCount: 0 };
let lastSessionStats: SessionTokenStats | null = null;
let lastSyncError: string | null = null;
let syncInProgress = false;
let syncQueued = false;
let otelLifecycleDisposables: vscode.Disposable[] = [];
let activeOtelFilePath: string | undefined;
const otelLifecycleRebuildQueue = new SingleFlightTaskQueue();

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = initializeLogger();
  context.subscriptions.push(outputChannel);
  logInfo("Extension activated", {
    extensionVersion: context.extension.packageJSON.version,
    vscodeVersion: vscode.version,
    workspaceFolders: vscode.workspace.workspaceFolders?.map(
      (folder) => folder.uri.fsPath,
    ),
  });

  const client = new TrackerClient(context.secrets, context.globalState);

  statusItem = vscode.window.createStatusBarItem(
    `${extensionId}.status`,
    vscode.StatusBarAlignment.Left,
    98,
  );
  statusItem.name = "Copilot Tracker";
  statusItem.command = `${extensionId}.setTask`;
  context.subscriptions.push(statusItem);

  sessionTokenStatusItem = vscode.window.createStatusBarItem(
    `${extensionId}.sessionTokens`,
    vscode.StatusBarAlignment.Left,
    97,
  );
  sessionTokenStatusItem.name = "Copilot Tracker Session Tokens";
  context.subscriptions.push(sessionTokenStatusItem);

  context.subscriptions.push(
    vscode.commands.registerCommand(`${extensionId}.setTask`, () =>
      setTask(context, client),
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(`${extensionId}.useBranchTask`, () =>
      useBranchTask(context, client),
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(`${extensionId}.syncCopilotSessions`, () =>
      syncCopilotSessions(context, client),
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(`${extensionId}.signIn`, () =>
      signIn(context, client),
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(`${extensionId}.openDashboard`, (sessionId?: string) =>
      openDashboard(sessionId),
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(`${extensionId}.showContext`, () =>
      showContext(context),
    ),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(`${extensionId}.showLogs`, () =>
      showLogs(),
    ),
  );
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: (uri) => handleAuthCallback(context, client, uri),
    }),
  );

  void initializeExtension(context, client);

  const branchPoller = setInterval(
    () => void refreshContext(context, client),
    10_000,
  );
  context.subscriptions.push({ dispose: () => clearInterval(branchPoller) });

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      logInfo("Workspace folders changed");
      void refreshContext(context, client, "extension-started");
      void rebuildOtelSyncLifecycle(context, client);
      scheduleSync(context, client, 350);
    }),
  );
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      logInfo("Active editor changed", {
        hasEditor: Boolean(editor),
      });
      void refreshContext(context, client);
    }),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      const affectsTrackerConfig = event.affectsConfiguration(extensionId);
      const affectsCopilotOtelConfig = event.affectsConfiguration(
        "github.copilot.chat.otel",
      );
      if (affectsTrackerConfig || affectsCopilotOtelConfig) {
        if (
          !affectsTrackerConfig &&
          affectsCopilotOtelConfig &&
          Date.now() - getLastCopilotOtelConfigurationWriteAt() < 5_000
        ) {
          logInfo("Ignored Copilot OTel configuration change from setup");
          return;
        }
        logInfo("Copilot Tracker or Copilot OTel configuration changed", {
          trackerConfig: getTrackerConfig(),
        });
        updateSessionTokenStatusItem();
        void rebuildOtelSyncLifecycle(context, client).then(() =>
          scheduleSync(context, client, 350),
        );
      }
    }),
  );
  context.subscriptions.push({ dispose: () => clearPendingSync() });
  context.subscriptions.push({ dispose: () => disposeOtelSyncLifecycle() });
}

export function deactivate() {
  logInfo("Extension deactivated");
}

async function initializeExtension(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  await rebuildOtelSyncLifecycle(context, client);
  await refreshContext(context, client, "extension-started");
  scheduleSync(context, client, 350);
}

async function rebuildOtelSyncLifecycle(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  await otelLifecycleRebuildQueue.run(() =>
    replaceOtelSyncLifecycle(context, client),
  );
}

async function replaceOtelSyncLifecycle(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  disposeOtelSyncLifecycle();
  try {
    const config = getTrackerConfig();
    const otelFilePath = await ensureCopilotOtelConfiguration(context, config);
    activeOtelFilePath = otelFilePath;
    lastOtelSignature = undefined;
    logInfo("Creating Copilot OTel sync lifecycle", {
      otelFilePath,
      syncIntervalSeconds: config.syncIntervalSeconds,
    });
    otelLifecycleDisposables = [
      ...createOtelFileWatcher(otelFilePath, () =>
        scheduleSync(context, client, 350),
      ),
    ];
    const syncPoller = setInterval(
      () => void pollForOtelChanges(context, client),
      config.syncIntervalSeconds * 1000,
    );
    otelLifecycleDisposables.push({
      dispose: () => clearInterval(syncPoller),
    });
    lastSyncError = null;
  } catch (error) {
    lastSyncError = error instanceof Error ? error.message : String(error);
    logError("Could not initialize Copilot OTel sync lifecycle", error);
    updateStatusItem(currentWorkspaceContext);
  }
}

function disposeOtelSyncLifecycle() {
  for (const disposable of otelLifecycleDisposables) {
    disposable.dispose();
  }
  otelLifecycleDisposables = [];
}

async function signIn(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  try {
    const signInStarted = await client.signInAndTrustServer(
      extensionAuthCallbackUri(context),
    );
    if (!signInStarted) {
      void vscode.window.showWarningMessage(
        "Copilot Tracker could not open the browser sign-in flow.",
        "Show Logs",
      ).then((choice) => {
        if (choice === "Show Logs") {
          showLogs();
        }
      });
      return;
    }

    void vscode.window.showInformationMessage(
      "Continue Copilot Tracker sign-in in your browser.",
    );
  } catch (error) {
    lastSyncError = error instanceof Error ? error.message : String(error);
    logError("Copilot Tracker sign-in failed", error);
    updateStatusItem(currentWorkspaceContext);
    void vscode.window.showErrorMessage(lastSyncError, "Show Logs").then(
      (choice) => {
        if (choice === "Show Logs") {
          showLogs();
        }
      },
    );
  }
}

async function handleAuthCallback(
  context: vscode.ExtensionContext,
  client: TrackerClient,
  uri: vscode.Uri,
) {
  if (uri.path !== "/auth") {
    logWarn("Ignoring unknown Copilot Tracker URI callback", {
      path: uri.path,
    });
    return;
  }

  try {
    await client.completeSignIn(uri);
    lastSyncError = null;
    updateStatusItem(currentWorkspaceContext);
    void vscode.window.showInformationMessage("Copilot Tracker is signed in.");
    scheduleSync(context, client, 350);
  } catch (error) {
    lastSyncError = error instanceof Error ? error.message : String(error);
    logError("Copilot Tracker sign-in callback failed", error);
    updateStatusItem(currentWorkspaceContext);
    void vscode.window.showWarningMessage(
      "Copilot Tracker sign-in callback failed.",
      "Show Logs",
    ).then((choice) => {
      if (choice === "Show Logs") {
        showLogs();
      }
    });
  }
}

function extensionAuthCallbackUri(context: vscode.ExtensionContext) {
  return vscode.Uri.parse(`${vscode.env.uriScheme}://${context.extension.id}/auth`);
}

async function setTask(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  const snapshot = await buildWorkspaceContext(context);
  const task = await pickAzureDevOpsTask(
    client,
    snapshot.selectedTask ?? snapshot.defaultTask ?? "",
  );

  if (task === undefined) {
    return;
  }

  await setSelectedTask(context, task.trim());
  logInfo("Manual task selected", { task: task.trim() });
  await refreshContext(context, client, "task-changed", {
    source: "manual-input",
  });
  await syncCopilotSessions(context, client);
}

async function useBranchTask(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  await setSelectedTask(context, undefined);
  logInfo("Reverted to branch-derived task");
  await refreshContext(context, client, "task-changed", {
    source: "branch-default",
  });
  await syncCopilotSessions(context, client);
}

async function pickAzureDevOpsTask(
  client: TrackerClient,
  initialValue: string,
): Promise<string | undefined> {
  interface TaskQuickPickItem extends vscode.QuickPickItem {
    taskId?: string;
    disabled?: boolean;
  }

  return new Promise((resolve) => {
    const quickPick = vscode.window.createQuickPick<TaskQuickPickItem>();
    const disposables: vscode.Disposable[] = [];
    let settled = false;
    let searchTimer: ReturnType<typeof setTimeout> | undefined;
    let searchSequence = 0;

    function finish(value: string | undefined) {
      if (settled) {
        return;
      }

      settled = true;
      searchSequence += 1;
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
      for (const disposable of disposables) {
        disposable.dispose();
      }
      quickPick.dispose();
      resolve(value);
    }

    function manualItem(value: string): TaskQuickPickItem {
      return {
        label: value ? `Use "${value}"` : "Type a task id or title",
        description: value ? "Manual task value" : undefined,
        taskId: value || undefined,
        disabled: !value,
      };
    }

    function scheduleSearch(value: string) {
      if (settled) {
        return;
      }

      const query = value.trim();
      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      if (query.length < 2 && !/^\d+$/u.test(query)) {
        quickPick.busy = false;
        quickPick.items = [manualItem(query)];
        return;
      }

      const sequence = ++searchSequence;
      searchTimer = setTimeout(() => {
        if (settled || sequence !== searchSequence) {
          return;
        }

        quickPick.busy = true;
        client
          .searchWorkItems(query)
          .then((workItems) => {
            if (settled || sequence !== searchSequence) {
              return;
            }
            quickPick.items = [
              ...workItems.map(workItemQuickPickItem),
              manualItem(query),
            ];
          })
          .catch((error: unknown) => {
            if (settled || sequence !== searchSequence) {
              return;
            }
            logWarn("Azure DevOps work item search failed", {
              error: error instanceof Error ? error.message : String(error),
            });
            quickPick.items = [
              {
                label: "Azure DevOps search unavailable",
                description: "Use the typed task value instead",
                disabled: true,
              },
              manualItem(query),
            ];
          })
          .finally(() => {
            if (!settled && sequence === searchSequence) {
              quickPick.busy = false;
            }
          });
      }, 250);
    }

    quickPick.title = "Assign Copilot usage to Azure DevOps work item";
    quickPick.placeholder = "Type a work item id or title";
    quickPick.ignoreFocusOut = true;
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;
    quickPick.value = initialValue;
    quickPick.items = [manualItem(initialValue.trim())];

    disposables.push(
      quickPick.onDidChangeValue((value) => {
        scheduleSearch(value);
      }),
      quickPick.onDidAccept(() => {
        const selected = quickPick.selectedItems[0];
        if (selected?.disabled) {
          return;
        }

        const task = selected?.taskId ?? quickPick.value.trim();
        finish(task || undefined);
      }),
      quickPick.onDidHide(() => {
        finish(undefined);
      }),
    );

    scheduleSearch(initialValue);
    quickPick.show();
  });
}

function workItemQuickPickItem(
  workItem: AzureDevOpsWorkItem,
): vscode.QuickPickItem & { taskId: string } {
  const detail = [
    workItem.assignedTo ? `Assigned to ${workItem.assignedTo}` : null,
    workItem.tags ? `Tags: ${workItem.tags}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    label: `$(issues) ${workItem.id}: ${workItem.title}`,
    description: [workItem.type, workItem.state, workItem.project]
      .filter(Boolean)
      .join(" / "),
    detail,
    taskId: String(workItem.id),
  };
}

async function showContext(context: vscode.ExtensionContext) {
  const snapshot = await buildWorkspaceContext(context);
  const config = getTrackerConfig();
  const details = [
    `Workspace: ${snapshot.workspaceName ?? "none"}`,
    `Repository name: ${getRepositoryDisplayName(snapshot)}`,
    `Repository: ${snapshot.repositoryRoot ? "detected" : "none"}`,
    `Remote: ${snapshot.repositoryRemoteUrl ? "detected" : "none"}`,
    `Branch: ${snapshot.branch ?? "none"}`,
    `Default task: ${snapshot.defaultTask ?? "none"}`,
    `Selected task: ${snapshot.selectedTask ?? "none"}`,
    `Server: ${config.serverUrl}`,
    `OTel file: ${config.otelFilePath ? "custom path configured" : "default extension storage"}`,
    `Chat title storage: default VS Code workspace storage`,
    `Last sync: ${lastSyncStats.requestCount} requests, ${lastSyncStats.tokenCount} tokens, ${lastSyncStats.missingTokenCount} missing token counts`,
    `Current session tokens: ${lastSessionStats ? `${lastSessionStats.totalTokens} total (${lastSessionStats.inputTokens} input / ${lastSessionStats.outputTokens} output)` : "none"}`,
  ];

  void vscode.window.showInformationMessage(details.join("\n"), {
    modal: true,
  });
}

async function openDashboard(sessionId?: string) {
  let url: URL;
  try {
    url = trackerDashboardUrl(getTrackerConfig().serverUrl, sessionId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Copilot Tracker server URL is invalid.";
    logError("Could not open Copilot Tracker dashboard", error);
    void vscode.window
      .showErrorMessage(message, "Open Settings", "Show Logs")
      .then((choice) => {
        if (choice === "Open Settings") {
          void vscode.commands.executeCommand(
            "workbench.action.openSettings",
            `${extensionId}.serverUrl`,
          );
        }
        if (choice === "Show Logs") {
          showLogs();
        }
      });
    return;
  }

  logInfo("Opening dashboard", { url: url.toString() });
  await vscode.env.openExternal(vscode.Uri.parse(url.toString()));
}

async function refreshContext(
  context: vscode.ExtensionContext,
  client: TrackerClient,
  eventType?: TrackerEventType,
  payload?: Record<string, unknown>,
) {
  const previous = currentWorkspaceContext;
  const next = await buildWorkspaceContext(context);
  currentWorkspaceContext = next;
  updateStatusItem(next);
  await recordTaskHistoryIfNeeded(
    context,
    previous,
    next,
    getTaskHistorySource(eventType, payload),
  );

  if (eventType) {
    logInfo("Workspace context refreshed", {
      eventType,
      workspaceName: next.workspaceName,
      repositoryName: getRepositoryDisplayName(next),
      repositoryRoot: next.repositoryRoot,
      repositoryRemoteUrl: next.repositoryRemoteUrl,
      branch: next.branch,
      defaultTask: next.defaultTask,
      selectedTask: next.selectedTask,
    });
  }

  if (previous && previous.branch !== next.branch) {
    logInfo("Branch changed", {
      previousBranch: previous.branch,
      nextBranch: next.branch,
      nextDefaultTask: next.defaultTask,
      nextSelectedTask: next.selectedTask,
    });
    await maybePromptForBranchTask(context, client, previous, next);
    await sendEvent(context, client, "branch-changed", {
      previousBranch: previous.branch,
      previousTask: previous.selectedTask,
    });
  }

  if (eventType) {
    await sendEvent(context, client, eventType, payload);
  }
}

async function maybePromptForBranchTask(
  context: vscode.ExtensionContext,
  client: TrackerClient,
  previous: WorkspaceContext,
  next: WorkspaceContext,
) {
  const prompt = branchTaskSwitchPrompt(
    previous,
    next,
    context.workspaceState.get<string>(lastBranchPromptKey),
  );
  if (!prompt) {
    return;
  }

  await context.workspaceState.update(lastBranchPromptKey, prompt.promptKey);
  logInfo("Prompting for branch task switch", {
    previousBranch: previous.branch,
    nextBranch: next.branch,
    defaultTask: prompt.task,
    selectedTask: next.selectedTask,
  });
  const choice = await vscode.window.showInformationMessage(
    `Branch changed to ${next.branch}. Assign Copilot usage to ${prompt.task}?`,
    "Switch task",
    "Keep current task",
  );

  if (choice === "Switch task") {
    logInfo("Branch task switch accepted", { task: prompt.task });
    await setSelectedTask(context, undefined);
    await refreshContext(context, client, "task-changed", {
      source: "branch-change-prompt",
    });
    await syncCopilotSessions(context, client);
  } else {
    logInfo("Branch task switch dismissed", { choice });
  }
}

async function recordTaskHistoryIfNeeded(
  context: vscode.ExtensionContext,
  previous: WorkspaceContext | undefined,
  next: WorkspaceContext,
  source: string,
) {
  const history = readTaskHistory(context);
  const latest = latestTaskHistoryForWorkspace(history, next.workspaceId);
  if (!shouldRecordTaskHistoryEntry(previous, next, latest)) {
    return;
  }

  const entry: TaskHistoryEntry = {
    workspaceId: next.workspaceId,
    timestamp: new Date().toISOString(),
    branch: next.branch,
    defaultTask: next.defaultTask,
    selectedTask: next.selectedTask,
    source,
  };

  await context.workspaceState.update(
    taskHistoryKey,
    [...history, entry].slice(-maxTaskHistoryEntries),
  );
  logInfo("Task history recorded", {
    source,
    branch: entry.branch,
    defaultTask: entry.defaultTask,
    selectedTask: entry.selectedTask,
    timestamp: entry.timestamp,
  });
}

function createTaskResolver(
  context: vscode.ExtensionContext,
  fallback: WorkspaceContext,
): RequestTaskResolver {
  const history = readTaskHistory(context).filter(
    (entry) => entry.workspaceId === fallback.workspaceId,
  );
  return createTaskResolverFromHistory(history, fallback);
}

function readTaskHistory(context: vscode.ExtensionContext): TaskHistoryEntry[] {
  return readTaskHistoryFromValue(context.workspaceState.get<unknown>(taskHistoryKey));
}

function updateStatusItem(snapshot: WorkspaceContext | undefined) {
  const task = snapshot?.selectedTask ?? "No task";
  const branch = snapshot?.branch
    ? `$(git-branch) ${snapshot.branch}`
    : "no git branch";
  statusItem.text = `${lastSyncError ? "$(warning)" : "AI"} ${compactStatusText(task)}`;
  statusItem.tooltip = [
    "Copilot Tracker",
    `Task: ${task}`,
    `Branch: ${branch}`,
    `Last sync: ${lastSyncStats.requestCount} requests, ${lastSyncStats.tokenCount} tokens`,
    lastSyncError ? `Last error: ${lastSyncError}` : null,
    "Click to change task",
  ]
    .filter(Boolean)
    .join("\n");
  statusItem.show();
  updateSessionTokenStatusItem();
}

function updateSessionTokenStatusItem() {
  if (!getTrackerConfig().showCurrentSessionTokensInStatusBar) {
    sessionTokenStatusItem.hide();
    return;
  }

  const stats = lastSessionStats;
  if (!stats) {
    sessionTokenStatusItem.text = "$(pulse) 0 tokens";
    sessionTokenStatusItem.tooltip =
      "Copilot Tracker\nNo Copilot chat session tokens captured yet.\nClick to open tracker.";
    sessionTokenStatusItem.command = {
      command: `${extensionId}.openDashboard`,
      title: "Open Copilot Tracker",
    };
    sessionTokenStatusItem.show();
    return;
  }

  const tooltip = new vscode.MarkdownString(
    [
      "**Copilot Tracker session**",
      "",
      `Session: ${stats.sessionTitle ?? stats.sessionId}`,
      `Requests: ${formatNumber(stats.requestCount)}`,
      `Input: ${formatNumber(stats.inputTokens)}`,
      `Output: ${formatNumber(stats.outputTokens)}`,
      `Total captured: ${formatNumber(stats.totalTokens)}`,
      stats.incompleteTokenRequestCount > 0
        ? `Incomplete token data: ${formatNumber(stats.incompleteTokenRequestCount)} requests`
        : null,
      `Estimated cost: ${formatEstimatedSessionCost(stats)}`,
      "",
      "Click to open this session in the web tracker.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  );
  tooltip.isTrusted = true;

  sessionTokenStatusItem.text = `$(pulse) ${formatCompactNumber(stats.totalTokens)} tokens`;
  sessionTokenStatusItem.tooltip = tooltip;
  sessionTokenStatusItem.command = {
    command: `${extensionId}.openDashboard`,
    title: "Open Copilot Tracker",
    arguments: [stats.sessionId],
  };
  sessionTokenStatusItem.show();
}

function scheduleSync(
  context: vscode.ExtensionContext,
  client: TrackerClient,
  delayMs: number,
) {
  clearPendingSync();
  logInfo("Sync scheduled", { delayMs });
  syncTimer = setTimeout(() => {
    syncTimer = undefined;
    void syncCopilotSessions(context, client);
  }, delayMs);
}

function clearPendingSync() {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = undefined;
  }
}

async function pollForOtelChanges(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  try {
    const config = getTrackerConfig();
    const otelFilePath =
      activeOtelFilePath ?? resolveOtelFilePath(context, config);
    const signature = await getOtelFileSignature(otelFilePath);
    if (lastOtelSignature === undefined) {
      lastOtelSignature = signature;
      logInfo("Initial Copilot OTel file signature captured", { otelFilePath });
      return;
    }
    if (signature !== lastOtelSignature) {
      lastOtelSignature = signature;
      logInfo("Copilot OTel file change detected", { otelFilePath });
      scheduleSync(context, client, 250);
    }
  } catch (error) {
    lastSyncError = error instanceof Error ? error.message : String(error);
    logError("Could not poll OTel file changes", error);
    updateStatusItem(currentWorkspaceContext);
  }
}

async function syncCopilotSessions(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  if (syncInProgress) {
    syncQueued = true;
    logInfo("Sync already in progress; queued another sync");
    return;
  }

  syncInProgress = true;
  try {
    do {
      syncQueued = false;
      await performCopilotSessionSync(context, client);
    } while (syncQueued);
  } finally {
    syncInProgress = false;
  }
}

async function performCopilotSessionSync(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  try {
    const config = getTrackerConfig();
    const otelFilePath =
      activeOtelFilePath ?? resolveOtelFilePath(context, config);
    await refreshContext(context, client);
    await sendEvent(context, client, "session-sync-started");

    const workspaceContext =
      currentWorkspaceContext ?? (await buildWorkspaceContext(context));
    logInfo("OTel session sync started", {
      workspaceName: workspaceContext.workspaceName,
      repositoryName: getRepositoryDisplayName(workspaceContext),
      repositoryRoot: workspaceContext.repositoryRoot,
      branch: workspaceContext.branch,
      selectedTask: workspaceContext.selectedTask,
      serverUrl: config.serverUrl,
      otelFilePath,
    });
    const sessionResolver =
      await createChatSessionTitleResolver(workspaceContext);
    const requests = await readCopilotOtelRequests(
      workspaceContext,
      otelFilePath,
      createTaskResolver(context, workspaceContext),
      sessionResolver,
    );
    logInfo("OTel session sync read completed", {
      requestCount: requests.length,
      tokenCount: requests.reduce(
        (total, request) => total + (request.totalTokens ?? 0),
        0,
      ),
      missingTokenCount: requests.filter(
        (request) => request.totalTokens === null,
      ).length,
    });
    const uploadScope = requestUploadScope(config.serverUrl);
    const uploadPlan = planRequestUpload(
      requests,
      readRequestUploadState(
        context.globalState,
        workspaceContext,
        uploadScope,
      ),
    );
    logInfo("OTel session sync upload selection completed", {
      requestCount: requests.length,
      changedRequestCount: uploadPlan.requestsToUpload.length,
      skippedUnchangedRequestCount: uploadPlan.skippedUnchangedRequestCount,
      trackedRequestCount: uploadPlan.trackedRequestCount,
    });
    await client.sendChatRequests(uploadPlan.requestsToUpload);
    await writeRequestUploadState(
      context.globalState,
      workspaceContext,
      uploadPlan.nextState,
      uploadScope,
    );
    lastSessionStats = currentSessionTokenStats(requests);
    lastSyncStats = {
      requestCount: requests.length,
      tokenCount: requests.reduce(
        (total, request) => total + (request.totalTokens ?? 0),
        0,
      ),
      missingTokenCount: requests.filter(
        (request) => request.totalTokens === null,
      ).length,
    };
    lastSyncError = null;
    updateStatusItem(workspaceContext);
    logInfo("OTel session sync finished", lastSyncStats);
    await sendEvent(context, client, "session-sync-finished", lastSyncStats);
  } catch (error) {
    lastSyncError = error instanceof Error ? error.message : String(error);
    logError("Session sync failed", error);
    updateStatusItem(currentWorkspaceContext);
    await sendEvent(context, client, "session-sync-failed", {
      message: lastSyncError,
    });
  }
}

function requestUploadScope(serverUrl: string) {
  try {
    return parseTrackerServerUrl(serverUrl).origin;
  } catch {
    return serverUrl;
  }
}

function getRepositoryDisplayName(workspaceContext: WorkspaceContext) {
  return (
    basename(workspaceContext.repositoryRoot) ??
    workspaceContext.workspaceName ??
    basename(workspaceContext.workspacePath) ??
    "unknown"
  );
}

function basename(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\\/g, "/").replace(/\/+$/g, "");
  return normalized.split("/").filter(Boolean).at(-1) ?? null;
}

async function sendEvent(
  context: vscode.ExtensionContext,
  client: TrackerClient,
  eventType: TrackerEventType,
  payload?: Record<string, unknown>,
) {
  const workspaceContext =
    currentWorkspaceContext ?? (await buildWorkspaceContext(context));
  const event: TrackerEvent = {
    ...workspaceContext,
    eventId: crypto.randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    user: "vscode-extension",
    vscodeVersion: vscode.version,
    extensionVersion: context.extension.packageJSON.version,
    payload,
  };

  try {
    await client.sendEvent(event);
    logInfo("Event sent", { eventType });
  } catch (error) {
    console.warn("Copilot Tracker failed to send event", error);
    logWarn("Failed to send event", {
      eventType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
