import * as vscode from "vscode";

import { normalizeRepositoryRemoteUrl } from "./otel";
import type { AzureDevOpsWorkItem } from "./trackerClient";

const maxAzureDevOpsWorkItemId = 2_147_483_647;
const terminalWorkItemStates = new Set([
  "accepted",
  "canceled",
  "cancelled",
  "closed",
  "complete",
  "completed",
  "done",
  "removed",
  "resolved",
]);

export interface TaskQuickPickItem extends vscode.QuickPickItem {
  taskId?: string;
  workItemUrl?: string;
  disabled?: boolean;
}

export interface WorkItemQuickPickContext {
  query?: string;
  repositoryRemoteUrl?: string | null;
  currentProject?: string | null;
}

export const openWorkItemButton: vscode.QuickInputButton = {
  iconPath: new vscode.ThemeIcon("link-external"),
  tooltip: "Open in Azure DevOps",
};

export function manualTaskQuickPickItem(value: string): TaskQuickPickItem {
  return {
    label: value ? `Use "${value}"` : "Type a task id or title",
    description: value ? "Manual task value" : undefined,
    taskId: value || undefined,
    disabled: !value,
  };
}

export function workItemQuickPickItem(
  workItem: AzureDevOpsWorkItem,
  context: WorkItemQuickPickContext = {},
): TaskQuickPickItem {
  const currentProject = normalizedProjectFromContext(context);
  const detail = [
    isSameProject(workItem.project, currentProject)
      ? "Current repo project"
      : null,
    workItem.assignedTo ? `Assigned to ${workItem.assignedTo}` : null,
    workItem.tags ? `Tags: ${workItem.tags}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
  const workItemUrl = safeWorkItemUrl(workItem.url);

  return {
    label: `$(${workItemTypeCodicon(workItem.type)}) ${workItem.id}: ${workItem.title}`,
    description: [workItem.type, workItem.state, workItem.project]
      .filter(Boolean)
      .join(" / "),
    detail,
    taskId: String(workItem.id),
    workItemUrl: workItemUrl ?? undefined,
    buttons: workItemUrl ? [openWorkItemButton] : undefined,
  };
}

export function sortWorkItemsForQuickPick(
  items: AzureDevOpsWorkItem[],
  context: WorkItemQuickPickContext = {},
) {
  const exactId = numericQueryId(context.query);
  const currentProject = normalizedProjectFromContext(context);

  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftRank = workItemRank(left.item, exactId, currentProject);
      const rightRank = workItemRank(right.item, exactId, currentProject);
      return compareRank(leftRank, rightRank) || left.index - right.index;
    })
    .map(({ item }) => item);
}

export function azureDevOpsProjectFromRemoteUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const normalizedRemote = new URL(normalizeRepositoryRemoteUrl(value));
    const host = normalizedRemote.hostname.toLowerCase();
    const segments = normalizedRemote.pathname
      .split("/")
      .filter((segment) => segment.length > 0);
    if (host === "dev.azure.com" && segments.length >= 3) {
      return decodePathSegment(segments[1] ?? null);
    }
    if (host.endsWith(".visualstudio.com") && segments.length >= 2) {
      return decodePathSegment(segments[0] ?? null);
    }
  } catch {
    return null;
  }

  return null;
}

export function isTerminalWorkItemState(state: string | null) {
  return workItemStateRank(state) > 0;
}

export function safeWorkItemUrl(url: string | null) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export function workItemTypeCodicon(type: string | null) {
  const normalizedType = type?.trim().toLowerCase() ?? "";
  if (normalizedType.includes("bug")) {
    return "bug";
  }
  if (normalizedType.includes("user story") || normalizedType === "story") {
    return "book";
  }
  if (normalizedType.includes("feature")) {
    return "flag";
  }
  if (normalizedType.includes("task")) {
    return "checklist";
  }
  if (normalizedType.includes("test")) {
    return "beaker";
  }
  if (normalizedType.includes("pull request")) {
    return "git-pull-request";
  }
  if (normalizedType.includes("issue")) {
    return "issues";
  }
  if (normalizedType.includes("change") || normalizedType.includes("chore")) {
    return "tools";
  }
  if (normalizedType.includes("document")) {
    return "file-text";
  }

  return "issues";
}

function workItemStateRank(state: string | null) {
  if (!state) {
    return 0;
  }

  return terminalWorkItemStates.has(state.trim().toLowerCase()) ? 1 : 0;
}

function workItemRank(
  item: AzureDevOpsWorkItem,
  exactId: number | null,
  currentProject: string | null,
) {
  return {
    exactId: exactId !== null && item.id === exactId ? 0 : 1,
    state: workItemStateRank(item.state),
    project: isSameProject(item.project, currentProject) ? 0 : 1,
    changedAt: changedAtRank(item.changedAt),
  };
}

function compareRank(
  left: ReturnType<typeof workItemRank>,
  right: ReturnType<typeof workItemRank>,
) {
  return (
    left.exactId - right.exactId ||
    left.state - right.state ||
    left.project - right.project ||
    right.changedAt - left.changedAt
  );
}

function changedAtRank(value: string | null) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function numericQueryId(query: string | undefined) {
  const normalizedQuery = query?.trim() ?? "";
  if (!/^\d+$/u.test(normalizedQuery)) {
    return null;
  }

  const id = Number(normalizedQuery);
  return Number.isSafeInteger(id) && id > 0 && id <= maxAzureDevOpsWorkItemId
    ? id
    : null;
}

function normalizedProjectFromContext(context: WorkItemQuickPickContext) {
  return normalizeProjectName(
    context.currentProject ??
      azureDevOpsProjectFromRemoteUrl(context.repositoryRemoteUrl ?? null),
  );
}

function isSameProject(project: string | null, currentProject: string | null) {
  return (
    currentProject !== null && normalizeProjectName(project) === currentProject
  );
}

function normalizeProjectName(project: string | null) {
  const normalized = project?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function decodePathSegment(segment: string | null) {
  if (!segment) {
    return null;
  }

  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
