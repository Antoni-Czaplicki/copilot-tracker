import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import * as vscode from "vscode";

import { WorkspaceContext } from "./types";

const execFileAsync = promisify(execFile);
const selectedTaskKey = "selectedTask";

export async function buildWorkspaceContext(
  context: vscode.ExtensionContext,
): Promise<WorkspaceContext> {
  const workspaceFolder = getWorkspaceFolder();
  const workspacePath = workspaceFolder?.uri.fsPath ?? null;
  const repositoryRoot = workspacePath
    ? await getRepositoryRoot(workspacePath)
    : null;
  const branch = repositoryRoot ? await getBranch(repositoryRoot) : null;
  const repositoryRemoteUrl = repositoryRoot
    ? await getRemoteUrl(repositoryRoot)
    : null;
  const defaultTask = branch ? getTaskFromBranch(branch) : null;
  const workspaceId = createWorkspaceId(workspacePath, repositoryRoot);
  const manuallySelectedTask =
    context.workspaceState.get<string>(selectedTaskStorageKey(workspaceId)) ??
    context.workspaceState.get<string>(selectedTaskKey);

  return {
    workspaceId,
    workspacePath,
    workspaceName: workspaceFolder?.name ?? null,
    repositoryRoot,
    repositoryRemoteUrl,
    branch,
    defaultTask,
    selectedTask: manuallySelectedTask ?? defaultTask,
  };
}

export async function setSelectedTask(
  context: vscode.ExtensionContext,
  task: string | undefined,
) {
  const snapshot = await buildWorkspaceContext(context);
  await context.workspaceState.update(
    selectedTaskStorageKey(snapshot.workspaceId),
    task,
  );
  await context.workspaceState.update(selectedTaskKey, undefined);
}

export function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  const activeDocument = vscode.window.activeTextEditor?.document.uri;
  if (activeDocument) {
    const activeFolder = vscode.workspace.getWorkspaceFolder(activeDocument);
    if (activeFolder) {
      return activeFolder;
    }
  }

  return vscode.workspace.workspaceFolders?.[0];
}

export async function getRepositoryRoot(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--show-toplevel"],
      { cwd },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export async function getBranch(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["branch", "--show-current"],
      { cwd },
    );
    const branch = stdout.trim();
    if (branch) {
      return branch;
    }

    const detached = await execFileAsync(
      "git",
      ["rev-parse", "--short", "HEAD"],
      { cwd },
    );
    return detached.stdout.trim() ? `detached-${detached.stdout.trim()}` : null;
  } catch {
    return null;
  }
}

export async function getRemoteUrl(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["config", "--get", "remote.origin.url"],
      { cwd },
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export function getTaskFromBranch(branch: string): string | null {
  const normalized = branch.trim();
  if (!normalized || normalized.startsWith("detached-")) {
    return null;
  }

  const prefixedWorkItem = normalized.match(
    /(?:^|\/)[A-Za-z][A-Za-z0-9]+-(\d+)(?=$|[^0-9.])/u,
  );
  if (prefixedWorkItem) {
    return prefixedWorkItem[1] ?? null;
  }

  const leadingSegmentNumber = normalized.match(
    /(?:^|\/)(\d+)(?=$|[^0-9.])/u,
  );
  return leadingSegmentNumber?.[1] ?? null;
}

function createWorkspaceId(
  workspacePath: string | null,
  repositoryRoot: string | null,
): string {
  const stableValue = repositoryRoot ?? workspacePath ?? "empty-window";
  return createHash("sha256").update(stableValue).digest("hex").slice(0, 16);
}

function selectedTaskStorageKey(workspaceId: string) {
  return `${selectedTaskKey}:${workspaceId}`;
}
