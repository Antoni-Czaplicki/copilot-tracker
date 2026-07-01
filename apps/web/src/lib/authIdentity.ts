import type { StoredUser } from "./store";

type StoredUserInput = Omit<StoredUser, "createdAt" | "lastSeenAt">;

export function localDevUserIdentity(): StoredUserInput {
  return {
    userId: "local-dev",
    login: "local-dev",
    name: "Local Developer",
    avatarUrl: null,
    email: null,
    githubLogin: null,
    role: "admin",
  };
}

export function parseBearerToken(value: string | null) {
  const match = value?.match(/^\s*Bearer\s+([^\s]+)\s*$/i);
  return match?.[1] ?? null;
}
