import { readResponseError } from "./responseErrors";

const maxAzureDevOpsWorkItemId = 2_147_483_647;

export interface WorkItemSearchItem {
  id: number;
  title: string;
  state: string | null;
  type: string | null;
  project: string | null;
  assignedTo: string | null;
  changedAt: string | null;
  url: string | null;
}

export function canSearchWorkItems(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue.length >= 2 || /^\d+$/u.test(normalizedValue);
}

export function emptyWorkItemSearchMessage(value: string) {
  return /^\d+$/u.test(value.trim())
    ? "No Azure DevOps match for this ID"
    : "No Azure DevOps matches";
}

export function workItemsFromSearchPayload(
  payload: unknown,
): WorkItemSearchItem[] {
  if (!isRecord(payload) || !Array.isArray(payload.workItems)) {
    return [];
  }

  return payload.workItems
    .map((item) => workItemFromValue(item))
    .filter((item): item is WorkItemSearchItem => item !== null);
}

export async function workItemSearchErrorMessage(response: Response) {
  const error = await readResponseError(response);
  if (error === "azure_devops_forbidden") {
    return "Azure DevOps work-item access is missing.";
  }
  if (error === "azure_devops_unauthorized") {
    return "Sign in to Azure DevOps again.";
  }
  if (error === "azure_devops_rate_limited") {
    return "Azure DevOps rate limit reached.";
  }

  return `Search failed (${response.status})`;
}

function workItemFromValue(value: unknown): WorkItemSearchItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const { id, title } = value;
  if (
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    id > maxAzureDevOpsWorkItemId ||
    typeof title !== "string"
  ) {
    return null;
  }

  return {
    id,
    title,
    state: nullableString(value.state),
    type: nullableString(value.type),
    project: nullableString(value.project),
    assignedTo: nullableString(value.assignedTo),
    changedAt: nullableString(value.changedAt),
    url: nullableString(value.url),
  };
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
