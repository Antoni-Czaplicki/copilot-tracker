import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import {
  adminAzureDevOpsLogins,
  appBaseUrl,
  authMode,
  azureDevOpsAccountsUrl,
  azureDevOpsOrg,
  azureDevOpsProfileUrl,
  azureDevOpsScope,
  requireAzureDevOpsOAuthConfig,
} from "./config";
import type { AzureDevOpsSessionTokens, StoredUser } from "./store";
import {
  clearSessionAzureDevOpsTokens,
  createSession,
  readUserById,
  readUserBySessionId,
  readSessionAzureDevOpsTokens,
  updateSessionAzureDevOpsTokens,
  upsertUser,
} from "./store";

export interface AzureDevOpsUser {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

const sessionCookieName = "copilot_tracker_session";
const oauthStateCookieName = "copilot_tracker_oauth_state";

export function sessionCookie() {
  return sessionCookieName;
}

export function oauthStateCookie() {
  return oauthStateCookieName;
}

export function secureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
  };
}

export function expiredCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
  };
}

export async function currentUser(): Promise<StoredUser | null> {
  if (authMode() === "disabled") {
    return upsertUser({
      userId: "local-dev",
      login: "local-dev",
      name: "Local Developer",
      avatarUrl: null,
      email: null,
      githubLogin: null,
      role: "admin",
    });
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(sessionCookieName)?.value;
  if (!sessionId) {
    return null;
  }

  return readUserBySessionId(sessionId);
}

export function isAdmin(user: StoredUser | null): boolean {
  if (!user) {
    return false;
  }

  return user.role === "admin";
}

export async function createUserSession(
  azureUser: AzureDevOpsUser,
  azureDevOpsTokens?: AzureDevOpsSessionTokens,
): Promise<string> {
  const user = await upsertAzureDevOpsUser(azureUser);
  const session = await createSession(user.userId, azureDevOpsTokens);
  return session.id;
}

export async function authenticateIngestRequest(
  request: NextRequest,
): Promise<StoredUser | null> {
  if (authMode() === "disabled") {
    return upsertUser({
      userId: "local-dev",
      login: "local-dev",
      name: "Local Developer",
      avatarUrl: null,
      email: null,
      githubLogin: null,
      role: "admin",
    });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  const azureUser = await fetchAzureDevOpsUser(token);
  if (!azureUser) {
    return null;
  }

  return upsertAzureDevOpsUser(azureUser);
}

export async function exchangeAzureDevOpsCode(code: string) {
  const oauthConfig = requireAzureDevOpsOAuthConfig();
  const response = await fetchWithTimeout(oauthConfig.tokenUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: oauthConfig.redirectUri,
      scope: azureDevOpsScope(),
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return toAzureDevOpsSessionTokens(payload);
}

export async function readAzureDevOpsSessionAccessToken(
  sessionId: string,
): Promise<string | null> {
  const tokens = await readSessionAzureDevOpsTokens(sessionId);
  if (!tokens) {
    return null;
  }

  if (!isTokenNearExpiry(tokens.expiresAt)) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    return null;
  }

  const refreshedTokens = await refreshAzureDevOpsAccessToken(
    tokens.refreshToken,
  );
  if (!refreshedTokens) {
    await clearSessionAzureDevOpsTokens(sessionId);
    return null;
  }

  await updateSessionAzureDevOpsTokens(sessionId, refreshedTokens);
  return refreshedTokens.accessToken;
}

async function refreshAzureDevOpsAccessToken(refreshToken: string) {
  const oauthConfig = requireAzureDevOpsOAuthConfig();
  const response = await fetchWithTimeout(oauthConfig.tokenUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: azureDevOpsScope(),
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  return toAzureDevOpsSessionTokens(payload, refreshToken);
}

export async function fetchAzureDevOpsUser(
  accessToken: string,
): Promise<AzureDevOpsUser | null> {
  const profileResponse = await fetchWithTimeout(
    new URL("/_apis/profile/profiles/me?api-version=7.1", azureDevOpsProfileUrl()),
    {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`,
        "user-agent": "copilot-tracker",
      },
    },
  );
  if (!profileResponse.ok) {
    return null;
  }

  const profile = (await profileResponse.json()) as {
    id?: string;
    displayName?: string;
    emailAddress?: string;
    publicAlias?: string;
    coreAttributes?: Record<string, { value?: string | null }>;
  };
  if (!profile.id) {
    return null;
  }

  const isMember = await validateAzureDevOpsOrgMembership(
    accessToken,
    profile.id,
  );
  if (!isMember) {
    return null;
  }

  const email =
    profile.emailAddress ??
    profile.coreAttributes?.Email?.value ??
    profile.coreAttributes?.Mail?.value ??
    null;
  const login = email ?? profile.publicAlias ?? profile.displayName ?? profile.id;

  return {
    id: profile.id,
    login,
    name: profile.displayName ?? null,
    email,
    avatarUrl: null,
  };
}

async function validateAzureDevOpsOrgMembership(
  accessToken: string,
  memberId: string,
) {
  const response = await fetchWithTimeout(
    new URL(
      `/_apis/accounts?memberId=${encodeURIComponent(memberId)}&api-version=7.1`,
      azureDevOpsAccountsUrl(),
    ),
    {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`,
        "user-agent": "copilot-tracker",
      },
    },
  );
  if (!response.ok) {
    return false;
  }

  const payload = (await response.json()) as {
    value?: { accountName?: string; accountUri?: string }[];
  };
  const expectedOrg = azureDevOpsOrg().toLowerCase();
  return (payload.value ?? []).some((account) => {
    const accountName = account.accountName?.toLowerCase();
    const accountUri = account.accountUri;
    return (
      accountName === expectedOrg ||
      accountUriContainsOrg(accountUri, expectedOrg)
    );
  });
}

async function upsertAzureDevOpsUser(
  azureUser: AzureDevOpsUser,
): Promise<StoredUser> {
  const existing = await readUserById(azureUser.id);
  const admins = adminAzureDevOpsLogins();
  return upsertUser({
    userId: azureUser.id,
    login: azureUser.login,
    name: azureUser.name,
    avatarUrl: azureUser.avatarUrl,
    email: azureUser.email,
    githubLogin: existing?.githubLogin ?? null,
    role: admins.has(azureUser.login.toLowerCase()) ? "admin" : "user",
  });
}

function toAzureDevOpsSessionTokens(
  payload: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  },
  fallbackRefreshToken: string | null = null,
): AzureDevOpsSessionTokens | null {
  if (!payload.access_token) {
    return null;
  }

  const expiresInSeconds =
    typeof payload.expires_in === "number" ? payload.expires_in : 3600;

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? fallbackRefreshToken,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  };
}

function isTokenNearExpiry(expiresAt: string | null) {
  if (!expiresAt) {
    return true;
  }

  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) || expiry <= Date.now() + 60_000;
}

function shouldUseSecureCookies() {
  try {
    return new URL(appBaseUrl()).protocol === "https:";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

function accountUriContainsOrg(value: string | undefined, expectedOrg: string) {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).pathname
      .split("/")
      .map((part) => part.toLowerCase())
      .includes(expectedOrg);
  } catch {
    return value
      .split("/")
      .map((part) => part.toLowerCase())
      .includes(expectedOrg);
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 15_000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
