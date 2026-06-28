import * as os from "node:os";
import * as vscode from "vscode";

import {
  type RequestTaskResolver,
  createChatSessionWatcher,
  getChatSessionSignature,
  getDefaultWorkspaceStorageRoot,
  readCopilotChatRequests,
} from "./chatStorage";
import { getGitHubToken } from "./githubAuth";
import {
  initializeLogger,
  logError,
  logInfo,
  logWarn,
  showLogs,
} from "./logger";
import { TrackerClient, getTrackerConfig } from "./trackerClient";
import { TrackerEvent, TrackerEventType, WorkspaceContext } from "./types";
import { buildWorkspaceContext, setSelectedTask } from "./workspaceContext";

const extensionId = "copilot-tracker";
const lastBranchPromptKey = "lastBranchPrompt";
const taskHistoryKey = "taskHistory";
const maxTaskHistoryEntries = 200;

interface TaskHistoryEntry {
  workspaceId: string;
  timestamp: string;
  branch: string | null;
  defaultTask: string | null;
  selectedTask: string | null;
  source: string;
}

let statusItem: vscode.StatusBarItem;
let currentWorkspaceContext: WorkspaceContext | undefined;
let lastChatSignature: string | undefined;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let lastSyncStats = { requestCount: 0, tokenCount: 0, missingTokenCount: 0 };

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

  const client = new TrackerClient(getGitHubToken);

  statusItem = vscode.window.createStatusBarItem(
    `${extensionId}.status`,
    vscode.StatusBarAlignment.Left,
    98,
  );
  statusItem.name = "Copilot Tracker";
  statusItem.command = `${extensionId}.setTask`;
  context.subscriptions.push(statusItem);

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
    vscode.commands.registerCommand(`${extensionId}.openDashboard`, () =>
      openDashboard(),
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

  void initializeExtension(context, client);

  const storageRoot =
    getTrackerConfig().chatStoragePath || getDefaultWorkspaceStorageRoot();
  logInfo("Creating chat storage watchers", { storageRoot });
  const watchers = createChatSessionWatcher(storageRoot, () =>
    scheduleSync(context, client, 350),
  );
  context.subscriptions.push(...watchers);

  const branchPoller = setInterval(
    () => void refreshContext(context, client),
    10_000,
  );
  context.subscriptions.push({ dispose: () => clearInterval(branchPoller) });

  const syncPoller = setInterval(
    () => void pollForChatStorageChanges(context, client),
    getTrackerConfig().syncIntervalSeconds * 1000,
  );
  context.subscriptions.push({ dispose: () => clearInterval(syncPoller) });

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      logInfo("Workspace folders changed");
      void refreshContext(context, client, "extension-started");
      scheduleSync(context, client, 350);
    }),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(extensionId)) {
        logInfo("Copilot Tracker configuration changed", getTrackerConfig());
        scheduleSync(context, client, 350);
      }
    }),
  );
  context.subscriptions.push({ dispose: () => clearPendingSync() });
}

export function deactivate() {
  logInfo("Extension deactivated");
}

async function initializeExtension(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  await refreshContext(context, client, "extension-started");
  await syncCopilotSessions(context, client);
}

async function setTask(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  const snapshot = await buildWorkspaceContext(context);
  const task = await vscode.window.showInputBox({
    title: "Assign Copilot usage to task",
    prompt: "Enter the current task number or identifier.",
    value: snapshot.selectedTask ?? snapshot.defaultTask ?? "",
    ignoreFocusOut: true,
    validateInput: (value) =>
      value.trim().length === 0 ? "Task cannot be empty." : undefined,
  });

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

async function showContext(context: vscode.ExtensionContext) {
  const snapshot = await buildWorkspaceContext(context);
  const config = getTrackerConfig();
  const details = [
    `Workspace: ${snapshot.workspaceName ?? "none"}`,
    `Repository name: ${getRepositoryDisplayName(snapshot)}`,
    `Repository: ${snapshot.repositoryRoot ?? "none"}`,
    `Remote: ${snapshot.repositoryRemoteUrl ?? "none"}`,
    `Branch: ${snapshot.branch ?? "none"}`,
    `Default task: ${snapshot.defaultTask ?? "none"}`,
    `Selected task: ${snapshot.selectedTask ?? "none"}`,
    `Server: ${config.serverUrl}`,
    `Chat storage: ${config.chatStoragePath || getDefaultWorkspaceStorageRoot()}`,
    `Last sync: ${lastSyncStats.requestCount} requests, ${lastSyncStats.tokenCount} tokens, ${lastSyncStats.missingTokenCount} missing token counts`,
  ];

  void vscode.window.showInformationMessage(details.join("\n"), {
    modal: true,
  });
}

async function openDashboard() {
  const url = new URL("/dashboard", getTrackerConfig().serverUrl);
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
  if (!next.defaultTask || next.selectedTask === next.defaultTask) {
    return;
  }

  const promptKey = `${previous.branch ?? "none"}->${next.branch ?? "none"}:${next.defaultTask}`;
  if (context.workspaceState.get<string>(lastBranchPromptKey) === promptKey) {
    return;
  }

  await context.workspaceState.update(lastBranchPromptKey, promptKey);
  logInfo("Prompting for branch task switch", {
    previousBranch: previous.branch,
    nextBranch: next.branch,
    defaultTask: next.defaultTask,
    selectedTask: next.selectedTask,
  });
  const choice = await vscode.window.showInformationMessage(
    `Branch changed to ${next.branch}. Assign Copilot usage to ${next.defaultTask}?`,
    "Switch task",
    "Keep current task",
  );

  if (choice === "Switch task") {
    logInfo("Branch task switch accepted", { task: next.defaultTask });
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
  if (!next.selectedTask && !next.defaultTask) {
    return;
  }

  if (
    previous &&
    previous.workspaceId === next.workspaceId &&
    previous.branch === next.branch &&
    previous.defaultTask === next.defaultTask &&
    previous.selectedTask === next.selectedTask
  ) {
    return;
  }

  const history = readTaskHistory(context);
  const latest = history.at(-1);
  if (
    latest &&
    latest.workspaceId === next.workspaceId &&
    latest.branch === next.branch &&
    latest.defaultTask === next.defaultTask &&
    latest.selectedTask === next.selectedTask
  ) {
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

  return (request) => {
    const requestTime = timestampOrZero(
      request.requestStartedAt ?? request.requestCompletedAt,
    );
    if (requestTime === 0) {
      return null;
    }

    let match: TaskHistoryEntry | undefined;
    for (const entry of history) {
      const entryTime = timestampOrZero(entry.timestamp);
      if (entryTime === 0) {
        continue;
      }
      if (entryTime > requestTime) {
        break;
      }
      match = entry;
    }

    if (!match) {
      return null;
    }

    return {
      branch: match.branch ?? fallback.branch,
      defaultTask: match.defaultTask ?? fallback.defaultTask,
      selectedTask:
        match.selectedTask ?? match.defaultTask ?? fallback.selectedTask,
    };
  };
}

function readTaskHistory(context: vscode.ExtensionContext): TaskHistoryEntry[] {
  const value = context.workspaceState.get<unknown>(taskHistoryKey);
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isTaskHistoryEntry)
    .sort(
      (a, b) => timestampOrZero(a.timestamp) - timestampOrZero(b.timestamp),
    );
}

function isTaskHistoryEntry(value: unknown): value is TaskHistoryEntry {
  return (
    isRecord(value) &&
    typeof value.workspaceId === "string" &&
    typeof value.timestamp === "string" &&
    isNullableString(value.branch) &&
    isNullableString(value.defaultTask) &&
    isNullableString(value.selectedTask) &&
    typeof value.source === "string"
  );
}

function getTaskHistorySource(
  eventType: TrackerEventType | undefined,
  payload: Record<string, unknown> | undefined,
) {
  return typeof payload?.source === "string"
    ? payload.source
    : (eventType ?? "workspace-refreshed");
}

function timestampOrZero(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function updateStatusItem(snapshot: WorkspaceContext) {
  const task = snapshot.selectedTask ?? "No task";
  const branch = snapshot.branch
    ? `$(git-branch) ${snapshot.branch}`
    : "no git branch";
  statusItem.text = `AI ${task}`;
  statusItem.tooltip = [
    "Copilot Tracker",
    `Task: ${task}`,
    `Branch: ${branch}`,
    `Last sync: ${lastSyncStats.requestCount} requests, ${lastSyncStats.tokenCount} tokens`,
    "Click to change task",
  ].join("\n");
  statusItem.show();
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

async function pollForChatStorageChanges(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  const config = getTrackerConfig();
  if (!config.readVsCodeChatStorage) {
    return;
  }

  try {
    const storageRoot =
      config.chatStoragePath || getDefaultWorkspaceStorageRoot();
    const signature = await getChatSessionSignature(storageRoot);
    if (lastChatSignature === undefined) {
      lastChatSignature = signature;
      logInfo("Initial chat storage signature captured", { storageRoot });
      return;
    }
    if (signature !== lastChatSignature) {
      lastChatSignature = signature;
      logInfo("Chat storage change detected", { storageRoot });
      scheduleSync(context, client, 250);
    }
  } catch (error) {
    console.warn("Copilot Tracker could not poll chat storage changes", error);
    logError("Could not poll chat storage changes", error);
  }
}

async function syncCopilotSessions(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  const config = getTrackerConfig();
  if (!config.readVsCodeChatStorage) {
    logInfo("Skipping session sync because chat storage reading is disabled");
    return;
  }

  await refreshContext(context, client);
  await sendEvent(context, client, "session-sync-started");

  try {
    const workspaceContext =
      currentWorkspaceContext ?? (await buildWorkspaceContext(context));
    logInfo("Session sync started", {
      workspaceName: workspaceContext.workspaceName,
      repositoryName: getRepositoryDisplayName(workspaceContext),
      repositoryRoot: workspaceContext.repositoryRoot,
      branch: workspaceContext.branch,
      selectedTask: workspaceContext.selectedTask,
      serverUrl: config.serverUrl,
      chatStoragePath:
        config.chatStoragePath || getDefaultWorkspaceStorageRoot(),
    });
    const requests = await readCopilotChatRequests(
      workspaceContext,
      config,
      createTaskResolver(context, workspaceContext),
    );
    logInfo("Session sync read completed", {
      requestCount: requests.length,
      tokenCount: requests.reduce(
        (total, request) => total + (request.totalTokens ?? 0),
        0,
      ),
      missingTokenCount: requests.filter(
        (request) => request.totalTokens === null,
      ).length,
    });
    await client.sendChatRequests(requests);
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
    updateStatusItem(workspaceContext);
    logInfo("Session sync finished", lastSyncStats);
    await sendEvent(context, client, "session-sync-finished", lastSyncStats);
  } catch (error) {
    console.warn("Copilot Tracker session sync failed", error);
    logError("Session sync failed", error);
    await sendEvent(context, client, "session-sync-failed", {
      message: error instanceof Error ? error.message : String(error),
    });
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
    user: os.userInfo().username,
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
