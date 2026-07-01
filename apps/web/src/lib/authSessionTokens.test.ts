import assert from "node:assert/strict";
import { test } from "node:test";

import {
  azureDevOpsSessionTokensFromPayload,
  isAzureDevOpsTokenNearExpiry,
} from "./authSessionTokens";

const nowMs = Date.parse("2026-07-01T00:00:00.000Z");

void test("azureDevOpsSessionTokensFromPayload trims tokens and applies expires_in", () => {
  assert.deepEqual(
    azureDevOpsSessionTokensFromPayload(
      {
        access_token: " access-token ",
        refresh_token: " refresh-token ",
        expires_in: 120,
      },
      { nowMs },
    ),
    {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresAt: "2026-07-01T00:02:00.000Z",
    },
  );
});

void test("azureDevOpsSessionTokensFromPayload falls back to the existing refresh token", () => {
  assert.deepEqual(
    azureDevOpsSessionTokensFromPayload(
      {
        access_token: "new-access-token",
        expires_in: 60,
      },
      {
        fallbackRefreshToken: "existing-refresh-token",
        nowMs,
      },
    ),
    {
      accessToken: "new-access-token",
      refreshToken: "existing-refresh-token",
      expiresAt: "2026-07-01T00:01:00.000Z",
    },
  );
});

void test("azureDevOpsSessionTokensFromPayload rejects missing or blank access tokens", () => {
  assert.equal(azureDevOpsSessionTokensFromPayload(null, { nowMs }), null);
  assert.equal(
    azureDevOpsSessionTokensFromPayload({ access_token: " " }, { nowMs }),
    null,
  );
  assert.equal(
    azureDevOpsSessionTokensFromPayload({ access_token: 123 }, { nowMs }),
    null,
  );
});

void test("azureDevOpsSessionTokensFromPayload defaults invalid expiry values to one hour", () => {
  assert.deepEqual(
    azureDevOpsSessionTokensFromPayload(
      {
        access_token: "access-token",
        expires_in: -1,
      },
      { nowMs },
    ),
    {
      accessToken: "access-token",
      refreshToken: null,
      expiresAt: "2026-07-01T01:00:00.000Z",
    },
  );
});

void test("isAzureDevOpsTokenNearExpiry refreshes missing, invalid, and soon-expiring tokens", () => {
  assert.equal(isAzureDevOpsTokenNearExpiry(null, nowMs), true);
  assert.equal(isAzureDevOpsTokenNearExpiry("not-a-date", nowMs), true);
  assert.equal(
    isAzureDevOpsTokenNearExpiry("2026-07-01T00:01:00.000Z", nowMs),
    true,
  );
  assert.equal(
    isAzureDevOpsTokenNearExpiry("2026-07-01T00:01:01.000Z", nowMs),
    false,
  );
});
