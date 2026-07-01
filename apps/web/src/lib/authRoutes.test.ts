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
  const response = await callbackRoute.GET(
    new NextRequest(
      "https://copilot-tracker.example/api/auth/callback/azure-devops?error=access_denied&error_description=do-not-reflect",
    ),
  );
  const redirectUrl = new URL(assertHeader(response, "location"));

  assert.equal(response.status, 307);
  assert.equal(redirectUrl.pathname, "/");
  assert.equal(redirectUrl.searchParams.get("auth"), "failed");
  assert.equal(redirectUrl.searchParams.get("auth_code"), "access_denied");
  assert.equal(redirectUrl.searchParams.has("error_description"), false);
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
  const response = await callbackRoute.GET(
    new NextRequest(
      `https://copilot-tracker.example/api/auth/callback/azure-devops?error=${encodeURIComponent(
        " invalid\n\tclient ".padEnd(120, "x"),
      )}&error_description=do-not-reflect`,
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
  const response = await callbackRoute.GET(
    new NextRequest(
      `https://copilot-tracker.example/api/auth/callback/azure-devops?error=${encodeURIComponent(
        "\n\t",
      )}`,
    ),
  );
  const redirectUrl = new URL(assertHeader(response, "location"));

  assert.equal(response.status, 307);
  assert.equal(redirectUrl.searchParams.get("auth_code"), "provider_error");
});

void test("Azure OAuth callback state mismatch fails safely and clears OAuth cookies", async () => {
  const response = await callbackRoute.GET(
    new NextRequest(
      "https://copilot-tracker.example/api/auth/callback/azure-devops?code=code&state=actual",
      {
        headers: {
          cookie:
            "copilot_tracker_oauth_state=expected; copilot_tracker_oauth_code_verifier=verifier",
        },
      },
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

void test("Azure OAuth callback missing code or verifier fails safely", async () => {
  const response = await callbackRoute.GET(
    new NextRequest(
      "https://copilot-tracker.example/api/auth/callback/azure-devops",
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
