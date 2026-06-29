import { env } from "@/env";

export function appBaseUrl() {
  return env.NEXT_PUBLIC_APP_URL;
}

export function githubApiUrl() {
  return env.GITHUB_API_URL;
}

export function githubCopilotBillingConfig() {
  const token = env.GITHUB_COPILOT_BILLING_TOKEN;
  const scopeType = env.GITHUB_COPILOT_BILLING_SCOPE_TYPE;
  const scope = env.GITHUB_COPILOT_BILLING_SCOPE;

  if (token === undefined || scopeType === undefined || scope === undefined) {
    return null;
  }

  return { token, scopeType, scope };
}

export function cronSecret() {
  return env.CRON_SECRET ?? null;
}

export function databaseUrl() {
  return env.DATABASE_URL;
}

export function authMode() {
  return env.COPILOT_TRACKER_AUTH_MODE;
}

export function leaderboardEnabled() {
  return env.COPILOT_TRACKER_LEADERBOARD_ENABLED;
}

export function adminAzureDevOpsLogins() {
  return new Set(
    (env.ADMIN_AZURE_DEVOPS_LOGINS ?? "")
      .split(",")
      .map((login) => login.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function azureDevOpsOrg() {
  const org = env.AZURE_DEVOPS_ORG;
  if (org === undefined) {
    throw new MissingAzureDevOpsOAuthConfigError();
  }

  return normalizeAzureDevOpsOrg(org);
}

export function azureDevOpsTenantId() {
  return env.AZURE_DEVOPS_TENANT_ID ?? "organizations";
}

export function azureDevOpsScope() {
  return [
    "openid",
    "profile",
    "email",
    "offline_access",
    "499b84ac-1321-427f-aa17-267ca6975798/vso.profile",
    "499b84ac-1321-427f-aa17-267ca6975798/vso.work",
  ].join(" ");
}

export function azureDevOpsProfileUrl() {
  return "https://app.vssps.visualstudio.com";
}

export function azureDevOpsAccountsUrl() {
  return "https://app.vssps.visualstudio.com";
}

export function azureDevOpsWorkItemsUrl() {
  return `https://dev.azure.com/${encodeURIComponent(azureDevOpsOrg())}`;
}

export class MissingAzureDevOpsOAuthConfigError extends Error {
  constructor() {
    super(
      "AZURE_DEVOPS_CLIENT_ID, AZURE_DEVOPS_CLIENT_SECRET, and AZURE_DEVOPS_ORG are required for Azure DevOps login.",
    );
    this.name = "MissingAzureDevOpsOAuthConfigError";
  }
}

export function requireAzureDevOpsOAuthConfig() {
  const clientId = env.AZURE_DEVOPS_CLIENT_ID;
  const clientSecret = env.AZURE_DEVOPS_CLIENT_SECRET;
  const org = env.AZURE_DEVOPS_ORG;
  if (
    clientId === undefined ||
    clientSecret === undefined ||
    org === undefined
  ) {
    throw new MissingAzureDevOpsOAuthConfigError();
  }

  const tenantId = azureDevOpsTenantId();
  return {
    clientId,
    clientSecret,
    org: normalizeAzureDevOpsOrg(org),
    authorizeUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    redirectUri: `${appBaseUrl()}/api/auth/callback/azure-devops`,
  };
}

function normalizeAzureDevOpsOrg(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    return url.pathname.split("/").find(Boolean) ?? trimmed;
  } catch {
    return trimmed;
  }
}
