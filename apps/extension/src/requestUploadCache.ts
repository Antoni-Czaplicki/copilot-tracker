import { createHash } from "node:crypto";

import type { CopilotChatRequest, WorkspaceContext } from "./types";

const requestUploadStateVersion = 1;
const maxTrackedRequestSignatures = 5_000;

export interface RequestUploadState {
  version: typeof requestUploadStateVersion;
  entries: Record<string, string>;
}

export interface RequestUploadPlan {
  requestsToUpload: CopilotChatRequest[];
  skippedUnchangedRequestCount: number;
  trackedRequestCount: number;
  nextState: RequestUploadState;
}

interface RequestUploadStateStore {
  get<T>(key: string): T | undefined;
  update(key: string, value: unknown): PromiseLike<void>;
}

export function readRequestUploadState(
  store: RequestUploadStateStore,
  workspaceContext: WorkspaceContext,
  uploadScope = "default",
): RequestUploadState {
  const stored = store.get<unknown>(
    requestUploadStateKey(workspaceContext, uploadScope),
  );
  if (!isRequestUploadState(stored)) {
    return { version: requestUploadStateVersion, entries: {} };
  }

  return stored;
}

export async function writeRequestUploadState(
  store: RequestUploadStateStore,
  workspaceContext: WorkspaceContext,
  state: RequestUploadState,
  uploadScope = "default",
) {
  await store.update(requestUploadStateKey(workspaceContext, uploadScope), state);
}

export function planRequestUpload(
  requests: CopilotChatRequest[],
  previousState: RequestUploadState,
): RequestUploadPlan {
  const trackedRequests = [...requests]
    .sort((a, b) => requestTimestamp(b) - requestTimestamp(a))
    .slice(0, maxTrackedRequestSignatures);
  const nextEntries: Record<string, string> = {};
  const requestsToUpload: CopilotChatRequest[] = [];

  for (const request of trackedRequests) {
    const signature = requestUploadSignature(request);
    nextEntries[request.requestRecordId] = signature;
    if (previousState.entries[request.requestRecordId] !== signature) {
      requestsToUpload.push(request);
    }
  }

  return {
    requestsToUpload: requestsToUpload.sort(compareRequestsChronologically),
    skippedUnchangedRequestCount:
      trackedRequests.length - requestsToUpload.length,
    trackedRequestCount: trackedRequests.length,
    nextState: {
      version: requestUploadStateVersion,
      entries: nextEntries,
    },
  };
}

function requestUploadStateKey(
  workspaceContext: WorkspaceContext,
  uploadScope: string,
) {
  const scopeHash = createHash("sha256")
    .update(uploadScope)
    .digest("hex")
    .slice(0, 16);
  return `requestUploadSignatures:${scopeHash}:${workspaceContext.workspaceId}`;
}

function requestUploadSignature(request: CopilotChatRequest) {
  return createHash("sha256")
    .update(JSON.stringify({ ...request, capturedAt: null }))
    .digest("hex");
}

function isRequestUploadState(value: unknown): value is RequestUploadState {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "version" in value &&
    value.version === requestUploadStateVersion &&
    "entries" in value &&
    Boolean(value.entries) &&
    typeof value.entries === "object" &&
    !Array.isArray(value.entries)
  );
}

function compareRequestsChronologically(
  a: CopilotChatRequest,
  b: CopilotChatRequest,
) {
  return requestTimestamp(a) - requestTimestamp(b);
}

function requestTimestamp(request: CopilotChatRequest) {
  const timestamp = Date.parse(
    request.requestCompletedAt ?? request.requestStartedAt ?? request.capturedAt,
  );
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
