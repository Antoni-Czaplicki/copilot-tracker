import { readResponseError } from "./responseErrors";

export function canSearchWorkItems(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue.length >= 2 || /^\d+$/u.test(normalizedValue);
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
