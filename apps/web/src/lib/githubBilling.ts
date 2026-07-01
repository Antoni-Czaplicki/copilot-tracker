import { githubApiUrl, githubCopilotBillingConfig } from "./config";
import { githubCopilotBillingRowsFromResponse } from "./githubBillingRows";
import { upsertGithubCopilotBillingUsage } from "./store";

export async function syncGithubCopilotBillingUsage(date = yesterdayUtcDate()) {
  const config = githubCopilotBillingConfig();
  if (!config) {
    throw new Error(
      "GITHUB_COPILOT_BILLING_TOKEN, GITHUB_COPILOT_BILLING_SCOPE_TYPE, and GITHUB_COPILOT_BILLING_SCOPE are required.",
    );
  }

  const endpoint = endpointForScope(config.scopeType, config.scope);

  const url = new URL(endpoint, githubApiUrl());
  const [year, month, day] = date.split("-");
  url.searchParams.set("year", year);
  url.searchParams.set("month", String(Number(month)));
  url.searchParams.set("day", String(Number(day)));

  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${config.token}`,
      "user-agent": "copilot-tracker",
      "x-github-api-version": "2026-03-10",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub AI credit usage sync failed with ${response.status}: ${await response.text()}`,
    );
  }

  const fetchedAt = new Date().toISOString();
  const { rows, usageDateValue } = githubCopilotBillingRowsFromResponse({
    body: await response.json(),
    fallbackDate: date,
    fetchedAt,
    scopeType: config.scopeType,
    scope: config.scope,
  });

  await upsertGithubCopilotBillingUsage(rows);
  return {
    synced: rows.length,
    date: usageDateValue,
    scopeType: config.scopeType,
    scope: config.scope,
  };
}

function yesterdayUtcDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function endpointForScope(
  scopeType: "user" | "organization" | "enterprise",
  scope: string,
) {
  if (scopeType === "enterprise") {
    return `/enterprises/${encodeURIComponent(scope)}/settings/billing/ai_credit/usage`;
  }

  if (scopeType === "organization") {
    return `/organizations/${encodeURIComponent(scope)}/settings/billing/ai_credit/usage`;
  }

  return `/users/${encodeURIComponent(scope)}/settings/billing/ai_credit/usage`;
}
