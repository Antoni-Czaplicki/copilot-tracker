import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

process.env.DATABASE_URL ??=
  "postgres://user:pass@localhost:5432/copilot_tracker";
process.env.NEXT_PUBLIC_APP_URL = "https://copilot-tracker.example";
process.env.AZURE_DEVOPS_CLIENT_ID = "test-client-id";
process.env.AZURE_DEVOPS_CLIENT_SECRET = "test-client-secret";
process.env.AZURE_DEVOPS_ORG = "test-org";
process.env.AZURE_DEVOPS_TENANT_ID = "test-tenant";

const startRoute = await import("../app/api/auth/azure-devops/route");
const callbackRoute = await import(
  "../app/api/auth/callback/azure-devops/route"
);
const originalFetch = globalThis.fetch;

void test("Azure OAuth start redirects to Microsoft with PKCE and expected scopes", async () => {
  const response = await startRoute.GET();
  const redirectUrl = new URL(assertHeader(response, "location"));

  assert.equal(response.status, 307);
  assert.equal(redirectUrl.origin, "https://login.microsoftonline.com");
  assert.equal(redirectUrl.pathname, "/test-tenant/oauth2/v2.0/authorize");
  assert.equal(redirectUrl.searchParams.get("client_id"), "test-client-id");
  assert.equal(redirectUrl.searchParams.get("response_type"), "code");
  assert.equal(
    redirectUrl.searchParams.get("redirect_uri"),
    "https://copilot-tracker.example/api/auth/callback/azure-devops",
  );
  assert.equal(redirectUrl.searchParams.get("response_mode"), "query");
  assert.equal(redirectUrl.searchParams.get("code_challenge_method"), "S256");
  assert.match(
    redirectUrl.searchParams.get("code_challenge") ?? "",
    /^[A-Za-z0-9_-]{43}$/,
  );
  assert.match(redirectUrl.searchParams.get("state") ?? "", /^[0-9a-f-]{36}$/);

  const scope = redirectUrl.searchParams.get("scope") ?? "";
  assert.match(scope, /offline_access/);
  assert.match(scope, /vso\.profile/);
  assert.match(scope, /vso\.work/);
});

void test("Azure OAuth start sets short-lived PKCE state and verifier cookies", async () => {
  const response = await startRoute.GET();
  const cookies = response.headers.getSetCookie();

  assert.equal(cookies.length, 2);
  assertCookie(cookies, "copilot_tracker_oauth_state", "Max-Age=600");
  assertCookie(cookies, "copilot_tracker_oauth_code_verifier", "Max-Age=600");
  assertCookie(cookies, "copilot_tracker_oauth_state", "Secure");
  assertCookie(cookies, "copilot_tracker_oauth_code_verifier", "HttpOnly");
  assertCookie(cookies, "copilot_tracker_oauth_state", "SameSite=lax");
});

void test("Azure OAuth callback provider errors redirect safely and clear OAuth cookies", async () => {
  const { response, warnings } = await captureWarnings(async () =>
    await callbackRoute.GET(
      new NextRequest(
        "https://copilot-tracker.example/api/auth/callback/azure-devops?error=access_denied&error_description=do-not-reflect",
      ),
    ),
  );
  const redirectUrl = new URL(assertHeader(response, "location"));
  const authRef = redirectUrl.searchParams.get("auth_ref") ?? "";
  const log = parseAuthLog(warnings);

  assert.equal(response.status, 307);
  assert.equal(redirectUrl.pathname, "/");
  assert.equal(redirectUrl.searchParams.get("auth"), "failed");
  assert.equal(redirectUrl.searchParams.get("auth_code"), "access_denied");
  assert.match(authRef, /^[0-9a-f]{16}$/);
  assert.equal(redirectUrl.searchParams.has("error_description"), false);
  assert.equal(log.authRef, authRef);
  assert.equal(log.code, "access_denied");
  assert.equal(log.event, "azure_oauth_callback_failed");
  assert.equal(log.providerError, "access_denied");
  assert.equal(log.providerErrorDescription, "do-not-reflect");
  assert.equal(log.requestPath, "/api/auth/callback/azure-devops");
  assert.equal(log.stage, "provider_error");
  assertCookie(
    response.headers.getSetCookie(),
    "copilot_tracker_oauth_state",
    "Max-Age=0",
  );
  assertCookie(
    response.headers.getSetCookie(),
    "copilot_tracker_oauth_code_verifier",
    "Max-Age=0",
  );
});

void test("Azure OAuth callback provider errors sanitize unsafe provider codes", async () => {
  const { response } = await captureWarnings(async () =>
    await callbackRoute.GET(
      new NextRequest(
        `https://copilot-tracker.example/api/auth/callback/azure-devops?error=${encodeURIComponent(
          " invalid\n\tclient ".padEnd(120, "x"),
        )}&error_description=do-not-reflect`,
      ),
    ),
  );
  const redirectUrl = new URL(assertHeader(response, "location"));
  const authCode = redirectUrl.searchParams.get("auth_code") ?? "";

  assert.equal(response.status, 307);
  assert.equal(authCode.length, 80);
  assert.match(authCode, /^invalid client x+$/);
  assert.equal(redirectUrl.searchParams.has("error_description"), false);
});

void test("Azure OAuth callback provider errors fall back for blank unsafe codes", async () => {
  const { response } = await captureWarnings(async () =>
    await callbackRoute.GET(
      new NextRequest(
        `https://copilot-tracker.example/api/auth/callback/azure-devops?error=${encodeURIComponent(
          "\n\t",
        )}`,
      ),
    ),
  );
  const redirectUrl = new URL(assertHeader(response, "location"));

  assert.equal(response.status, 307);
  assert.equal(redirectUrl.searchParams.get("auth_code"), "provider_error");
});

void test("Azure OAuth callback state mismatch fails safely and clears OAuth cookies", async () => {
  const { response, warnings } = await captureWarnings(async () =>
    await callbackRoute.GET(
      new NextRequest(
        "https://copilot-tracker.example/api/auth/callback/azure-devops?code=code&state=actual",
        {
          headers: {
            cookie:
              "copilot_tracker_oauth_state=expected; copilot_tracker_oauth_code_verifier=verifier",
          },
        },
      ),
    ),
  );
  const redirectUrl = new URL(assertHeader(response, "location"));
  const log = parseAuthLog(warnings);

  assert.equal(response.status, 307);
  assert.equal(redirectUrl.searchParams.get("auth"), "failed");
  assert.equal(redirectUrl.searchParams.get("auth_code"), "invalid_oauth_state");
  assert.equal(log.code, "invalid_oauth_state");
  assert.equal(log.hasCode, true);
  assert.equal(log.hasCodeVerifier, true);
  assert.equal(log.hasExpectedState, true);
  assert.equal(log.hasState, true);
  assert.equal(log.stage, "oauth_state");
  assert.equal(log.stateMatches, false);
  assertCookie(
    response.headers.getSetCookie(),
    "copilot_tracker_oauth_state",
    "Max-Age=0",
  );
  assertCookie(
    response.headers.getSetCookie(),
    "copilot_tracker_oauth_code_verifier",
    "Max-Age=0",
  );
});

void test("Azure OAuth callback missing code or verifier fails safely", async () => {
  const { response } = await captureWarnings(async () =>
    await callbackRoute.GET(
      new NextRequest(
        "https://copilot-tracker.example/api/auth/callback/azure-devops",
      ),
    ),
  );
  const redirectUrl = new URL(assertHeader(response, "location"));

  assert.equal(response.status, 307);
  assert.equal(redirectUrl.searchParams.get("auth"), "failed");
  assert.equal(redirectUrl.searchParams.get("auth_code"), "invalid_oauth_state");
  assertCookie(
    response.headers.getSetCookie(),
    "copilot_tracker_oauth_state",
    "Max-Age=0",
  );
  assertCookie(
    response.headers.getSetCookie(),
    "copilot_tracker_oauth_code_verifier",
    "Max-Age=0",
  );
});

void test("Azure OAuth callback logs profile and org diagnostics server-side", async (context) => {
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const requests: CapturedFetch[] = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ input, init });
    const url = new URL(String(input));
    if (url.pathname.endsWith("/oauth2/v2.0/token")) {
      await Promise.resolve();
      return Response.json({
        access_token: "access-token",
        expires_in: 3600,
        refresh_token: "refresh-token",
      });
    }

    if (url.pathname === "/_apis/profile/profiles/me") {
      await Promise.resolve();
      return Response.json({
        displayName: "Test User",
        id: "user-id",
      });
    }

    if (url.pathname === "/_apis/accounts") {
      await Promise.resolve();
      return Response.json({ value: [] });
    }

    assert.fail(`unexpected fetch to ${url.href}`);
  };

  const { response, warnings } = await captureWarnings(async () =>
    await callbackRoute.GET(
      new NextRequest(
        "https://copilot-tracker.example/api/auth/callback/azure-devops?code=code&state=expected",
        {
          headers: {
            cookie:
              "copilot_tracker_oauth_state=expected; copilot_tracker_oauth_code_verifier=verifier",
          },
        },
      ),
    ),
  );
  const redirectUrl = new URL(assertHeader(response, "location"));
  const log = parseAuthLog(warnings);

  assert.equal(response.status, 307);
  assert.equal(redirectUrl.searchParams.get("auth"), "failed");
  assert.equal(
    redirectUrl.searchParams.get("auth_code"),
    "profile_or_org_check_failed",
  );
  assert.equal(log.code, "profile_or_org_check_failed");
  assert.equal(log.hasProfileId, true);
  assert.equal(log.orgMembershipAccountCount, 0);
  assert.equal(log.orgMembershipResult, "not_matched");
  assert.equal(log.orgMembershipStatus, 200);
  assert.equal(log.profileResult, "ok");
  assert.equal(log.profileStatus, 200);
  assert.equal(log.stage, "profile_or_org_check");
  assert.equal(requests.length, 3);
});

function assertHeader(response: Response, name: string) {
  const value = response.headers.get(name);
  if (value === null) {
    assert.fail(`${name} header should be set`);
  }
  return value;
}

function assertCookie(cookies: string[], name: string, expectedPart: string) {
  const cookie = cookies.find((value) => value.startsWith(`${name}=`));
  if (cookie === undefined) {
    assert.fail(`${name} cookie should be set`);
  }
  assert.equal(cookie.includes(expectedPart), true);
}

async function captureWarnings(action: () => Promise<Response>) {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...values: unknown[]) => {
    warnings.push(values.map(String).join(" "));
  };
  try {
    return {
      response: await action(),
      warnings,
    };
  } finally {
    console.warn = originalWarn;
  }
}

function parseAuthLog(warnings: string[]) {
  assert.equal(warnings.length, 1);
  const parsed = JSON.parse(warnings[0] ?? "{}") as Record<string, unknown>;
  return parsed;
}

interface CapturedFetch {
  input: RequestInfo | URL;
  init?: RequestInit;
}
