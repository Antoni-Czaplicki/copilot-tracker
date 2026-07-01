import type { AzureDevOpsSessionTokens } from "./store";

const defaultAccessTokenLifetimeSeconds = 3600;
const tokenRefreshSkewMs = 60_000;

export function azureDevOpsSessionTokensFromPayload(
  payload: Record<string, unknown> | null,
  {
    fallbackRefreshToken = null,
    nowMs = Date.now(),
  }: {
    fallbackRefreshToken?: string | null;
    nowMs?: number;
  } = {},
): AzureDevOpsSessionTokens | null {
  const accessToken = readStringField(payload, "access_token");
  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: readStringField(payload, "refresh_token") ?? fallbackRefreshToken,
    expiresAt: new Date(nowMs + expiresInSeconds(payload) * 1000).toISOString(),
  };
}

export function isAzureDevOpsTokenNearExpiry(
  expiresAt: string | null,
  nowMs = Date.now(),
): boolean {
  if (!expiresAt) {
    return true;
  }

  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) || expiry <= nowMs + tokenRefreshSkewMs;
}

function expiresInSeconds(payload: Record<string, unknown> | null) {
  const expiresIn = payload?.expires_in;
  return typeof expiresIn === "number" &&
    Number.isFinite(expiresIn) &&
    expiresIn > 0
    ? expiresIn
    : defaultAccessTokenLifetimeSeconds;
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
