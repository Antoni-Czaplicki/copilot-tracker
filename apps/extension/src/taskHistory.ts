import type { RequestTaskResolver } from "./otel";
import type {
  TrackerEventType,
  WorkspaceContext,
} from "./types";

export interface TaskHistoryEntry {
  workspaceId: string;
  timestamp: string;
  branch: string | null;
  defaultTask: string | null;
  selectedTask: string | null;
  source: string;
}

type TaskHistorySnapshot = Pick<
  TaskHistoryEntry,
  "workspaceId" | "branch" | "defaultTask" | "selectedTask"
>;

export function createTaskResolverFromHistory(
  history: TaskHistoryEntry[],
  _fallback: WorkspaceContext,
): RequestTaskResolver {
  const sortedHistory = sortTaskHistory(history);

  return (request) => {
    const requestTime = timestampOrZero(
      request.requestStartedAt ?? request.requestCompletedAt,
    );
    if (requestTime === 0) {
      return null;
    }

    let match: TaskHistoryEntry | undefined;
    for (const entry of sortedHistory) {
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
      branch: match.branch,
      defaultTask: match.defaultTask,
      selectedTask: match.selectedTask ?? match.defaultTask,
    };
  };
}

export function latestTaskHistoryForWorkspace(
  history: TaskHistoryEntry[],
  workspaceId: string,
): TaskHistoryEntry | undefined {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (entry?.workspaceId === workspaceId) {
      return entry;
    }
  }

  return undefined;
}

export function shouldRecordTaskHistoryEntry(
  previous: WorkspaceContext | undefined,
  next: WorkspaceContext,
  latest: TaskHistoryEntry | undefined,
): boolean {
  const previousForWorkspace =
    previous?.workspaceId === next.workspaceId ? previous : undefined;
  const latestForWorkspace =
    latest?.workspaceId === next.workspaceId ? latest : undefined;

  if (previousForWorkspace && sameTaskSnapshot(previousForWorkspace, next)) {
    return false;
  }

  if (latestForWorkspace && sameTaskSnapshot(latestForWorkspace, next)) {
    return false;
  }

  return (
    hasTask(next) ||
    Boolean(previousForWorkspace && hasTask(previousForWorkspace)) ||
    Boolean(latestForWorkspace && hasTask(latestForWorkspace))
  );
}

export function readTaskHistoryFromValue(value: unknown): TaskHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return sortTaskHistory(value.filter(isTaskHistoryEntry));
}

export function getTaskHistorySource(
  eventType: TrackerEventType | undefined,
  payload: Record<string, unknown> | undefined,
) {
  return typeof payload?.source === "string"
    ? payload.source
    : (eventType ?? "workspace-refreshed");
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

function sortTaskHistory(history: TaskHistoryEntry[]) {
  return [...history].sort(
    (a, b) => timestampOrZero(a.timestamp) - timestampOrZero(b.timestamp),
  );
}

function sameTaskSnapshot(
  first: TaskHistorySnapshot,
  second: TaskHistorySnapshot,
) {
  return (
    first.workspaceId === second.workspaceId &&
    first.branch === second.branch &&
    first.defaultTask === second.defaultTask &&
    first.selectedTask === second.selectedTask
  );
}

function hasTask(snapshot: TaskHistorySnapshot) {
  return Boolean(snapshot.selectedTask || snapshot.defaultTask);
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
