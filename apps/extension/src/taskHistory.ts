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

export function createTaskResolverFromHistory(
  history: TaskHistoryEntry[],
  fallback: WorkspaceContext,
): RequestTaskResolver {
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

export function readTaskHistoryFromValue(value: unknown): TaskHistoryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isTaskHistoryEntry)
    .sort(
      (a, b) => timestampOrZero(a.timestamp) - timestampOrZero(b.timestamp),
    );
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
