import type { WorkspaceContext } from "./types";

export interface BranchTaskSwitchPrompt {
  promptKey: string;
  task: string;
}

export function branchTaskSwitchPrompt(
  previous: WorkspaceContext,
  next: WorkspaceContext,
  lastPromptKey: string | undefined,
): BranchTaskSwitchPrompt | null {
  if (!next.defaultTask || next.selectedTask === next.defaultTask) {
    return null;
  }

  const promptKey = `${next.workspaceId}:${previous.branch ?? "none"}->${next.branch ?? "none"}:${next.defaultTask}`;
  if (lastPromptKey === promptKey) {
    return null;
  }

  return {
    promptKey,
    task: next.defaultTask,
  };
}
