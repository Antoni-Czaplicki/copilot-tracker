import { githubApiUrl, githubCopilotBillingConfig } from './config';
import { StoredGithubCopilotBillingUsage, upsertGithubCopilotBillingUsage } from './store';

interface GitHubAiCreditUsageResponse {
  timePeriod?: {
    year?: number;
    month?: number;
    day?: number;
  };
  usageItems?: Array<Record<string, unknown>>;
}

export async function syncGithubCopilotBillingUsage(date = yesterdayUtcDate()) {
  const config = githubCopilotBillingConfig();
  if (!config) {
    throw new Error('GITHUB_COPILOT_BILLING_TOKEN, GITHUB_COPILOT_BILLING_SCOPE_TYPE, and GITHUB_COPILOT_BILLING_SCOPE are required.');
  }

  const endpoint = endpointForScope(config.scopeType, config.scope);

  const url = new URL(endpoint, githubApiUrl());
  const [year, month, day] = date.split('-');
  url.searchParams.set('year', year);
  url.searchParams.set('month', String(Number(month)));
  url.searchParams.set('day', String(Number(day)));

  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${config.token}`,
      'user-agent': 'copilot-tracker',
      'x-github-api-version': '2026-03-10',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub AI credit usage sync failed with ${response.status}: ${await response.text()}`);
  }

  const body = await response.json() as GitHubAiCreditUsageResponse;
  const usageDateValue = usageDate(body.timePeriod, date);
  const fetchedAt = new Date().toISOString();
  const rows = (body.usageItems ?? []).map((item, index): StoredGithubCopilotBillingUsage => {
    const model = stringValue(item.model);
    const sku = stringValue(item.sku);
    const unitType = stringValue(item.unitType);
    return {
      id: [config.scopeType, config.scope, usageDateValue, model ?? 'unknown-model', sku ?? 'unknown-sku', unitType ?? 'unknown-unit', index].join(':'),
      scopeType: config.scopeType,
      scope: config.scope,
      date: usageDateValue,
      product: stringValue(item.product),
      sku,
      quantity: stringValue(item.netQuantity ?? item.grossQuantity),
      unitType,
      grossAmount: stringValue(item.grossAmount),
      discountAmount: stringValue(item.discountAmount),
      netAmount: stringValue(item.netAmount),
      raw: item,
      fetchedAt,
    };
  });

  await upsertGithubCopilotBillingUsage(rows);
  return { synced: rows.length, date: usageDateValue, scopeType: config.scopeType, scope: config.scope };
}

function yesterdayUtcDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function endpointForScope(scopeType: 'user' | 'organization' | 'enterprise', scope: string) {
  if (scopeType === 'enterprise') {
    return `/enterprises/${encodeURIComponent(scope)}/settings/billing/ai_credit/usage`;
  }

  if (scopeType === 'organization') {
    return `/organizations/${encodeURIComponent(scope)}/settings/billing/ai_credit/usage`;
  }

  return `/users/${encodeURIComponent(scope)}/settings/billing/ai_credit/usage`;
}

function usageDate(timePeriod: GitHubAiCreditUsageResponse['timePeriod'], fallback: string) {
  if (!timePeriod) {
    return fallback;
  }

  const year = timePeriod?.year ?? new Date().getUTCFullYear();
  const month = String(timePeriod?.month ?? 1).padStart(2, '0');
  const day = String(timePeriod?.day ?? 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function stringValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}
