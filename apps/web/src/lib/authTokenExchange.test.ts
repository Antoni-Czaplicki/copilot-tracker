import assert from "node:assert/strict";
import { test } from "node:test";

process.env.DATABASE_URL ??=
  "postgres://user:pass@localhost:5432/copilot_tracker";
process.env.NEXT_PUBLIC_APP_URL = "https://copilot-tracker.example";
process.env.AZURE_DEVOPS_CLIENT_ID = "test-client-id";
process.env.AZURE_DEVOPS_CLIENT_SECRET = "test-client-secret";
process.env.AZURE_DEVOPS_ORG = "test-org";
process.env.AZURE_DEVOPS_TENANT_ID = "test-tenant";

const { AzureDevOpsTokenExchangeError, exchangeAzureDevOpsCode } = await import(
  "./auth"
);

const originalFetch = globalThis.fetch;

void test("exchangeAzureDevOpsCode sends the PKCE verifier and returns session tokens", async (context) => {
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  let capturedRequest: CapturedFetch | undefined;
  globalThis.fetch = async (input, init) => {
    capturedRequest = { input, init };
    await Promise.resolve();
    return Response.json({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
    });
  };

  const tokens = await exchangeAzureDevOpsCode("auth-code", "pkce-verifier");

  assert.equal(tokens.accessToken, "access-token");
  assert.equal(tokens.refreshToken, "refresh-token");
  assert.match(tokens.expiresAt ?? "", /^\d{4}-\d{2}-\d{2}T/);

  if (capturedRequest === undefined) {
    assert.fail("token exchange should call fetch");
  }

  const requestUrl = new URL(String(capturedRequest.input));
  assert.equal(
    requestUrl.href,
    "https://login.microsoftonline.com/test-tenant/oauth2/v2.0/token",
  );
  assert.equal(capturedRequest.init?.method, "POST");
  assert.deepEqual(
    capturedRequest.init?.headers,
    {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
  );

  const body = capturedRequest.init?.body;
  assert.ok(body instanceof URLSearchParams);
  assert.equal(body.get("client_id"), "test-client-id");
  assert.equal(body.get("client_secret"), "test-client-secret");
  assert.equal(body.get("code"), "auth-code");
  assert.equal(body.get("code_verifier"), "pkce-verifier");
  assert.equal(body.get("grant_type"), "authorization_code");
  assert.equal(
    body.get("redirect_uri"),
    "https://copilot-tracker.example/api/auth/callback/azure-devops",
  );
  assert.match(body.get("scope") ?? "", /offline_access/);
  assert.match(body.get("scope") ?? "", /vso\.profile/);
  assert.match(body.get("scope") ?? "", /vso\.work/);
});

void test("exchangeAzureDevOpsCode maps Azure JSON failures to typed errors", async (context) => {
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => {
    await Promise.resolve();
    return Response.json(
      {
        error: "invalid_client",
        error_description: "Client authentication failed.",
      },
      { status: 401 },
    );
  };

  await assert.rejects(
    exchangeAzureDevOpsCode("auth-code", "pkce-verifier"),
    (error: unknown) =>
      error instanceof AzureDevOpsTokenExchangeError &&
      error.code === "invalid_client" &&
      error.description === "Client authentication failed.",
  );
});

interface CapturedFetch {
  input: RequestInfo | URL;
  init?: RequestInit;
}
