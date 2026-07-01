export function canSearchWorkItems(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue.length >= 2 || /^\d+$/u.test(normalizedValue);
}

export async function workItemSearchErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (payload.error === "azure_devops_forbidden") {
      return "Azure DevOps work-item access is missing.";
    }
    if (payload.error === "azure_devops_unauthorized") {
      return "Sign in to Azure DevOps again.";
    }
    if (payload.error === "azure_devops_rate_limited") {
      return "Azure DevOps rate limit reached.";
    }
  } catch {
    // Fall through to status-based messages.
  }

  return `Search failed (${response.status})`;
}
