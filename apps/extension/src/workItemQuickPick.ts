import * as vscode from "vscode";

import type { AzureDevOpsWorkItem } from "./trackerClient";

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
): TaskQuickPickItem {
  const detail = [
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

export function sortWorkItemsForQuickPick(items: AzureDevOpsWorkItem[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (left, right) =>
        workItemStateRank(left.item.state) -
          workItemStateRank(right.item.state) || left.index - right.index,
    )
    .map(({ item }) => item);
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
