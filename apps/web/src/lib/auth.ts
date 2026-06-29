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
import type { StoredUser } from "./store";
import { createSession, readDatabase, upsertUser } from "./store";

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

  const database = await readDatabase();
  const session = database.sessions.find((entry) => entry.id === sessionId);
  if (!session || Date.parse(session.expiresAt) <= Date.now()) {
    return null;
  }

  return database.users.find((user) => user.userId === session.userId) ?? null;
}

export function isAdmin(user: StoredUser | null): boolean {
  if (!user) {
    return false;
  }

  return user.role === "admin";
}

export async function createUserSession(
  azureUser: AzureDevOpsUser,
): Promise<string> {
  const user = await upsertAzureDevOpsUser(azureUser);
  const session = await createSession(user.userId);
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
  const response = await fetch(oauthConfig.tokenUrl, {
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

  const payload = (await response.json()) as { access_token?: string };
  return payload.access_token && payload.access_token.length > 0
    ? payload.access_token
    : null;
}

export async function fetchAzureDevOpsUser(
  accessToken: string,
): Promise<AzureDevOpsUser | null> {
  const profileResponse = await fetch(
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
  const response = await fetch(
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
    const accountUri = account.accountUri?.toLowerCase();
    return (
      accountName === expectedOrg ||
      accountUri?.includes(`/${expectedOrg}`) === true
    );
  });
}

async function upsertAzureDevOpsUser(
  azureUser: AzureDevOpsUser,
): Promise<StoredUser> {
  const database = await readDatabase();
  const existing = database.users.find((user) => user.userId === azureUser.id);
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
