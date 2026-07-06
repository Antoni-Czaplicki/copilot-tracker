import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import * as vscode from "vscode";

import { WorkspaceContext } from "./types";

const execFileAsync = promisify(execFile);
const selectedTaskKey = "selectedTask";

interface GitRepositoryState {
  HEAD?: { name?: string; commit?: string };
  remotes: { name: string; fetchUrl?: string }[];
  onDidChange: vscode.Event<void>;
}

interface GitRepository {
  rootUri: vscode.Uri;
  state: GitRepositoryState;
}

interface GitApi {
  repositories: GitRepository[];
  onDidOpenRepository: vscode.Event<GitRepository>;
  getRepository?(uri: vscode.Uri): GitRepository | null;
}

interface GitExtensionExports {
  getAPI(version: 1): GitApi;
  enabled: boolean;
}

interface GitRepositoryInfo {
  repositoryRoot: string;
  branch: string | null;
  repositoryRemoteUrl: string | null;
}

export async function getGitApi(): Promise<GitApi | null> {
  try {
    const extension =
      vscode.extensions.getExtension<GitExtensionExports>("vscode.git");
    if (!extension) {
      return null;
    }

    const exports = extension.isActive
      ? extension.exports
      : await extension.activate();
    if (!exports.enabled) {
      return null;
    }

    return exports.getAPI(1);
  } catch {
    return null;
  }
}

function resolveGitRepository(
  api: GitApi,
  workspacePath: string,
): GitRepository | null {
  if (api.getRepository) {
    const repository = api.getRepository(vscode.Uri.file(workspacePath));
    if (repository) {
      return repository;
    }
  }

  const normalizedTarget = normalizeFsPath(workspacePath);
  let bestMatch: GitRepository | null = null;
  let bestLength = -1;
  for (const repository of api.repositories) {
    const normalizedRoot = normalizeFsPath(repository.rootUri.fsPath);
    if (
      isPathPrefix(normalizedRoot, normalizedTarget) &&
      normalizedRoot.length > bestLength
    ) {
      bestMatch = repository;
      bestLength = normalizedRoot.length;
    }
  }

  return bestMatch;
}

async function getGitRepositoryInfo(
  workspacePath: string,
): Promise<GitRepositoryInfo | null> {
  const api = await getGitApi();
  if (!api) {
    return null;
  }

  const repository = resolveGitRepository(api, workspacePath);
  if (!repository) {
    return null;
  }

  const repositoryRoot = repository.rootUri.fsPath;
  const headName = repository.state.HEAD?.name;
  const branch = headName
    ? headName
    : repository.state.HEAD?.commit
      ? await getBranch(repositoryRoot)
      : null;
  const remotes = repository.state.remotes;
  const originRemote = remotes.find((remote) => remote.name === "origin");
  const repositoryRemoteUrl =
    originRemote?.fetchUrl ?? remotes[0]?.fetchUrl ?? null;

  return { repositoryRoot, branch, repositoryRemoteUrl };
}

function normalizeFsPath(value: string): string {
  const normalized = value.replace(/\\/gu, "/").replace(/\/+$/u, "");
  return process.platform === "linux" ? normalized : normalized.toLowerCase();
}

function isPathPrefix(prefix: string, target: string): boolean {
  if (prefix === target) {
    return true;
  }

  return target.startsWith(`${prefix}/`);
}

export async function buildWorkspaceContext(
  context: vscode.ExtensionContext,
): Promise<WorkspaceContext> {
  const workspaceFolder = getWorkspaceFolder();
  const workspaceFolderPaths = uniqueStrings(
    vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [],
  );
  const workspaceFilePath = vscode.workspace.workspaceFile?.fsPath ?? null;
  const workspacePath = workspaceFolder?.uri.fsPath ?? null;

  const gitInfo = workspacePath
    ? await getGitRepositoryInfo(workspacePath)
    : null;

  let repositoryRoot: string | null;
  let branch: string | null;
  let repositoryRemoteUrl: string | null;
  if (gitInfo) {
    repositoryRoot = gitInfo.repositoryRoot;
    branch = gitInfo.branch;
    repositoryRemoteUrl = gitInfo.repositoryRemoteUrl;
  } else {
    repositoryRoot = workspacePath
      ? await getRepositoryRoot(workspacePath)
      : null;
    branch = repositoryRoot ? await getBranch(repositoryRoot) : null;
    repositoryRemoteUrl = repositoryRoot
      ? await getRemoteUrl(repositoryRoot)
      : null;
  }

  const defaultTask = branch ? getTaskFromBranch(branch) : null;
  const workspaceId = createWorkspaceId(workspacePath, repositoryRoot);
  const manuallySelectedTask = context.workspaceState.get<string>(
    selectedTaskStorageKey(workspaceId),
  );

  return {
    workspaceId,
    workspacePath,
    workspaceFolderPaths,
    workspaceFilePath,
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

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}
