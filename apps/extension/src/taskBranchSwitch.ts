import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { logWarn } from "./logger";
import { getTaskFromBranch } from "./workspaceContext";

const execFileAsync = promisify(execFile);
const remoteFetchTimeoutMs = 10_000;

export const defaultTaskBranchBaseBranches = ["main", "dev", "beta"];
export const defaultTaskBranchNamePrefix = "";

export interface TaskBranchRef {
  branchName: string;
  refName: string;
  kind: "local" | "remote";
}

export function normalizeTaskBranchBaseBranches(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return defaultTaskBranchBaseBranches;
  }

  return [
    ...new Set(
      value
        .filter((branch): branch is string => typeof branch === "string")
        .map((branch) => branch.trim())
        .filter(Boolean),
    ),
  ];
}

export function isTaskBranchBaseBranch(
  branch: string | null,
  baseBranches: string[],
) {
  const normalizedBranch = branch?.trim().toLowerCase();
  return (
    Boolean(normalizedBranch) &&
    baseBranches.some(
      (baseBranch) => baseBranch.trim().toLowerCase() === normalizedBranch,
    )
  );
}

export function normalizeTaskBranchNamePrefix(value: unknown) {
  if (typeof value !== "string") {
    return defaultTaskBranchNamePrefix;
  }

  const prefix = value.trim();
  return prefix.toLowerCase() === "ticket/" ? "" : prefix;
}

export async function findTaskBranches(
  repositoryRoot: string,
  task: string,
): Promise<TaskBranchRef[]> {
  await refreshRemoteBranches(repositoryRoot);
  const { stdout } = await execFileAsync(
    "git",
    ["for-each-ref", "--format=%(refname)", "refs/heads", "refs/remotes"],
    { cwd: repositoryRoot },
  );
  return parseGitBranchRefs(stdout).filter(
    (branch) => getTaskFromBranch(branch.branchName) === task,
  );
}

export async function checkoutTaskBranch(
  repositoryRoot: string,
  branch: TaskBranchRef,
) {
  if (branch.kind === "local") {
    await execFileAsync("git", ["checkout", branch.branchName], {
      cwd: repositoryRoot,
    });
    return;
  }

  await execFileAsync("git", ["checkout", "--track", branch.refName], {
    cwd: repositoryRoot,
  });
}

export async function createTaskBranch(
  repositoryRoot: string,
  branchName: string,
) {
  await execFileAsync("git", ["checkout", "-b", branchName], {
    cwd: repositoryRoot,
  });
}

export function parseGitBranchRefs(stdout: string): TaskBranchRef[] {
  const branches = new Map<string, TaskBranchRef>();

  for (const line of stdout.split(/\r?\n/u)) {
    const refName = line.trim();
    const branch = parseGitBranchRef(refName);
    if (!branch) {
      continue;
    }

    const key = branch.branchName.toLowerCase();
    const existing = branches.get(key);
    if (!existing || branch.kind === "local") {
      branches.set(key, branch);
    }
  }

  return [...branches.values()].sort(compareTaskBranchRefs);
}

export function suggestedTaskBranchName(task: string, prefix: string): string {
  const normalizedPrefix = prefix.trim();
  const slug = slugBranchSegment(task);
  return normalizedPrefix ? `${normalizedPrefix}${slug}` : slug;
}

export function validateTaskBranchName(branchName: string): string | null {
  const normalized = branchName.trim();
  if (!normalized) {
    return "Branch name is required.";
  }
  if (
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    normalized.endsWith("/") ||
    normalized.endsWith(".") ||
    normalized.includes("//") ||
    /[\s~^:?*[\\]/u.test(normalized)
  ) {
    return "Use a valid Git branch name.";
  }

  return null;
}

async function refreshRemoteBranches(repositoryRoot: string) {
  try {
    await execFileAsync("git", ["fetch", "--all", "--prune", "--quiet"], {
      cwd: repositoryRoot,
      timeout: remoteFetchTimeoutMs,
    });
  } catch (error) {
    logWarn("Could not refresh remote branches before task branch search", {
      repositoryRoot,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function parseGitBranchRef(refName: string): TaskBranchRef | null {
  if (refName.startsWith("refs/heads/")) {
    const branchName = refName.slice("refs/heads/".length);
    return branchName ? { branchName, refName, kind: "local" } : null;
  }

  if (!refName.startsWith("refs/remotes/")) {
    return null;
  }

  const rest = refName.slice("refs/remotes/".length);
  const slashIndex = rest.indexOf("/");
  if (slashIndex < 1) {
    return null;
  }

  const branchName = rest.slice(slashIndex + 1);
  if (!branchName || branchName === "HEAD") {
    return null;
  }

  return { branchName, refName, kind: "remote" };
}

function compareTaskBranchRefs(left: TaskBranchRef, right: TaskBranchRef) {
  if (left.kind !== right.kind) {
    return left.kind === "local" ? -1 : 1;
  }

  return left.branchName.localeCompare(right.branchName);
}

function slugBranchSegment(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/gu, "-")
      .replace(/^[._-]+|[._-]+$/gu, "") || "task"
  );
}
