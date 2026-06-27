import { cookies } from "next/headers";
import { NextRequest } from "next/server";

import { adminGithubLogins, authMode, githubApiUrl } from "./config";
import { StoredUser, createSession, readDatabase, upsertUser } from "./store";

export interface GitHubUser {
  id: number;
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
      githubId: 0,
      login: "local-dev",
      name: "Local Developer",
      avatarUrl: null,
      email: null,
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

  return (
    database.users.find((user) => user.githubId === session.githubId) ?? null
  );
}

export function isAdmin(user: StoredUser | null): boolean {
  if (!user) {
    return false;
  }

  return user.role === "admin";
}

export async function createUserSession(
  githubUser: GitHubUser,
): Promise<string> {
  const admins = adminGithubLogins();
  const user = await upsertUser({
    githubId: githubUser.id,
    login: githubUser.login,
    name: githubUser.name,
    avatarUrl: githubUser.avatarUrl,
    email: githubUser.email,
    role: admins.has(githubUser.login.toLowerCase()) ? "admin" : "user",
  });
  const session = await createSession(user.githubId);
  return session.id;
}

export async function authenticateIngestRequest(
  request: NextRequest,
): Promise<StoredUser | null> {
  if (authMode() === "disabled") {
    return upsertUser({
      githubId: 0,
      login: "local-dev",
      name: "Local Developer",
      avatarUrl: null,
      email: null,
      role: "admin",
    });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  const githubUser = await fetchGitHubUser(token);
  if (!githubUser) {
    return null;
  }

  const admins = adminGithubLogins();
  return upsertUser({
    githubId: githubUser.id,
    login: githubUser.login,
    name: githubUser.name,
    avatarUrl: githubUser.avatarUrl,
    email: githubUser.email,
    role: admins.has(githubUser.login.toLowerCase()) ? "admin" : "user",
  });
}

export async function fetchGitHubUser(
  accessToken: string,
): Promise<GitHubUser | null> {
  const response = await fetch(new URL("/user", githubApiUrl()), {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${accessToken}`,
      "user-agent": "copilot-tracker",
    },
  });
  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as {
    id: number;
    login: string;
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  return {
    id: user.id,
    login: user.login,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
  };
}
