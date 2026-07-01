import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import {
  adminAzureDevOpsLogins,
  authMode,
  azureDevOpsAccountsUrl,
  azureDevOpsOrg,
  azureDevOpsProfileUrl,
  azureDevOpsScope,
  requireAzureDevOpsOAuthConfig,
} from "./config";
import { localDevUserIdentity, parseBearerToken } from "./authIdentity";
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

export { expiredCookieOptions, secureCookieOptions } from "./authCookies";
export { createOauthPkceChallenge } from "./oauthPkce";

export interface AzureDevOpsUser {
  id: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export class AzureDevOpsTokenExchangeError extends Error {
  public constructor(
    public readonly code: string,
    public readonly description: string,
  ) {
    super(description);
    this.name = "AzureDevOpsTokenExchangeError";
  }
}

const sessionCookieName = "copilot_tracker_session";
const oauthStateCookieName = "copilot_tracker_oauth_state";
const oauthCodeVerifierCookieName = "copilot_tracker_oauth_code_verifier";

export function sessionCookie() {
  return sessionCookieName;
}

export function oauthStateCookie() {
  return oauthStateCookieName;
}

export function oauthCodeVerifierCookie() {
  return oauthCodeVerifierCookieName;
}

export async function currentUser(): Promise<StoredUser | null> {
  if (authMode() === "disabled") {
    return upsertUser(localDevUserIdentity());
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
    return upsertUser(localDevUserIdentity());
  }

  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) {
    return null;
  }

  const azureUser = await fetchAzureDevOpsUser(token);
  if (!azureUser) {
    return null;
  }

  return upsertAzureDevOpsUser(azureUser);
}

export async function exchangeAzureDevOpsCode(
  code: string,
  codeVerifier: string,
) {
  const oauthConfig = requireAzureDevOpsOAuthConfig();
  const body = new URLSearchParams({
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: oauthConfig.redirectUri,
    scope: azureDevOpsScope(),
  });

  const response = await fetchWithTimeout(oauthConfig.tokenUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw await toAzureDevOpsTokenExchangeError(response);
  }

  const payload = await readJsonObject(response);
  const tokens = toAzureDevOpsSessionTokens(payload);
  if (!tokens) {
    throw new AzureDevOpsTokenExchangeError(
      "invalid_token_response",
      "Azure DevOps token response did not include an access token.",
    );
  }

  return tokens;
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

  const payload = await readJsonObject(response);
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

  const profile = await readJsonObject(profileResponse);
  const profileId = readStringField(profile, "id");
  if (!profile || !profileId) {
    return null;
  }

  const isMember = await validateAzureDevOpsOrgMembership(
    accessToken,
    profileId,
  );
  if (!isMember) {
    return null;
  }

  const email =
    readStringField(profile, "emailAddress") ??
    readCoreAttributeValue(profile, "Email") ??
    readCoreAttributeValue(profile, "Mail") ??
    null;
  const displayName = readStringField(profile, "displayName");
  const login =
    email ?? readStringField(profile, "publicAlias") ?? displayName ?? profileId;

  return {
    id: profileId,
    login,
    name: displayName,
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

  const payload = await readJsonObject(response);
  if (!payload || !Array.isArray(payload.value)) {
    return false;
  }

  const expectedOrg = azureDevOpsOrg().toLowerCase();
  return payload.value.some((account) => {
    if (!isRecord(account)) {
      return false;
    }

    const accountName = readStringField(account, "accountName")?.toLowerCase();
    const accountUri = readStringField(account, "accountUri") ?? undefined;
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
  payload: Record<string, unknown> | null,
  fallbackRefreshToken: string | null = null,
): AzureDevOpsSessionTokens | null {
  const accessToken = readStringField(payload, "access_token");
  if (!accessToken) {
    return null;
  }

  const expiresIn = payload?.expires_in;
  const expiresInSeconds =
    typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0
      ? expiresIn
      : 3600;

  return {
    accessToken,
    refreshToken: readStringField(payload, "refresh_token") ?? fallbackRefreshToken,
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

async function readJsonObject(response: Response) {
  try {
    const payload: unknown = await response.json();
    return isRecord(payload) ? payload : null;
  } catch {
    return null;
  }
}

function readStringField(
  value: Record<string, unknown> | null,
  key: string,
) {
  const field = value?.[key];
  if (typeof field !== "string") {
    return null;
  }

  const trimmed = field.trim();
  return trimmed || null;
}

function readCoreAttributeValue(
  profile: Record<string, unknown>,
  key: string,
) {
  const coreAttributes = profile.coreAttributes;
  if (!isRecord(coreAttributes)) {
    return null;
  }

  const attribute = coreAttributes[key];
  if (!isRecord(attribute)) {
    return null;
  }

  return readStringField(attribute, "value");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

async function toAzureDevOpsTokenExchangeError(response: Response) {
  const fallback = `Azure DevOps token endpoint returned HTTP ${response.status}.`;
  try {
    const payload = (await response.json()) as {
      error?: unknown;
      error_description?: unknown;
    };
    return new AzureDevOpsTokenExchangeError(
      typeof payload.error === "string"
        ? payload.error
        : "token_exchange_failed",
      typeof payload.error_description === "string"
        ? payload.error_description
        : fallback,
    );
  } catch {
    return new AzureDevOpsTokenExchangeError("token_exchange_failed", fallback);
  }
}
