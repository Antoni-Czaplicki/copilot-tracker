import * as os from "node:os";
import * as vscode from "vscode";

import {
  createChatSessionWatcher,
  getChatSessionSignature,
  getDefaultWorkspaceStorageRoot,
  readCopilotChatRequests,
} from "./chatStorage";
import { getGitHubToken } from "./githubAuth";
import { TrackerClient, getTrackerConfig } from "./trackerClient";
import { TrackerEvent, TrackerEventType, WorkspaceContext } from "./types";
import { buildWorkspaceContext, setSelectedTask } from "./workspaceContext";

const extensionId = "copilot-tracker";
const lastBranchPromptKey = "lastBranchPrompt";

let statusItem: vscode.StatusBarItem;
let currentWorkspaceContext: WorkspaceContext | undefined;
let lastChatSignature: string | undefined;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let lastSyncStats = { requestCount: 0, tokenCount: 0, missingTokenCount: 0 };

export function activate(context: vscode.ExtensionContext) {
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

  void refreshContext(context, client, "extension-started");
  void syncCopilotSessions(context, client);

  const storageRoot =
    getTrackerConfig().chatStoragePath || getDefaultWorkspaceStorageRoot();
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
      void refreshContext(context, client, "extension-started");
      scheduleSync(context, client, 350);
    }),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(extensionId)) {
        scheduleSync(context, client, 350);
      }
    }),
  );
  context.subscriptions.push({ dispose: () => clearPendingSync() });
}

export function deactivate() {}

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

  if (previous && previous.branch !== next.branch) {
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
  const choice = await vscode.window.showInformationMessage(
    `Branch changed to ${next.branch}. Assign Copilot usage to ${next.defaultTask}?`,
    "Switch task",
    "Keep current task",
  );

  if (choice === "Switch task") {
    await setSelectedTask(context, undefined);
    await refreshContext(context, client, "task-changed", {
      source: "branch-change-prompt",
    });
    await syncCopilotSessions(context, client);
  }
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
    const signature = await getChatSessionSignature(
      config.chatStoragePath || getDefaultWorkspaceStorageRoot(),
    );
    if (lastChatSignature === undefined) {
      lastChatSignature = signature;
      return;
    }
    if (signature !== lastChatSignature) {
      lastChatSignature = signature;
      scheduleSync(context, client, 250);
    }
  } catch (error) {
    console.warn("Copilot Tracker could not poll chat storage changes", error);
  }
}

async function syncCopilotSessions(
  context: vscode.ExtensionContext,
  client: TrackerClient,
) {
  const config = getTrackerConfig();
  if (!config.readVsCodeChatStorage) {
    return;
  }

  await refreshContext(context, client);
  await sendEvent(context, client, "session-sync-started");

  try {
    const workspaceContext =
      currentWorkspaceContext ?? (await buildWorkspaceContext(context));
    const requests = await readCopilotChatRequests(workspaceContext, config);
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
    await sendEvent(context, client, "session-sync-finished", lastSyncStats);
  } catch (error) {
    console.warn("Copilot Tracker session sync failed", error);
    await sendEvent(context, client, "session-sync-failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
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
  } catch (error) {
    console.warn("Copilot Tracker failed to send event", error);
  }
}
