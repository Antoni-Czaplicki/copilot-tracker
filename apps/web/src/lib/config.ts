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

export function adminGithubLogins() {
  return new Set(
    (env.ADMIN_GITHUB_LOGINS ?? "")
      .split(",")
      .map((login) => login.trim().toLowerCase())
      .filter(Boolean),
  );
}

export class MissingGithubOAuthConfigError extends Error {
  constructor() {
    super(
      "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required for GitHub login.",
    );
    this.name = "MissingGithubOAuthConfigError";
  }
}

export function requireGithubOAuthConfig() {
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  if (clientId === undefined || clientSecret === undefined) {
    throw new MissingGithubOAuthConfigError();
  }

  return { clientId, clientSecret };
}
