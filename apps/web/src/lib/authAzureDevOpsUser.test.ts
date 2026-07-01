import assert from "node:assert/strict";
import { test } from "node:test";
import type { TestContext } from "node:test";

process.env.DATABASE_URL ??=
  "postgres://user:pass@localhost:5432/copilot_tracker";
process.env.NEXT_PUBLIC_APP_URL = "https://copilot-tracker.example";
process.env.AZURE_DEVOPS_CLIENT_ID = "test-client-id";
process.env.AZURE_DEVOPS_CLIENT_SECRET = "test-client-secret";
process.env.AZURE_DEVOPS_ORG = "test-org";
process.env.AZURE_DEVOPS_TENANT_ID = "test-tenant";

const { fetchAzureDevOpsUser, fetchAzureDevOpsUserWithDiagnostics } =
  await import("./auth");
const originalFetch = globalThis.fetch;

void test("fetchAzureDevOpsUser maps Azure profile fields when org membership matches by account name", async (context) => {
  const requests = mockFetch(context, [
    Response.json({
      id: "user-id",
      displayName: "Test User",
      publicAlias: "public-alias",
      coreAttributes: {
        Email: { value: "person@example.com" },
      },
    }),
    Response.json({
      value: [{ accountName: "test-org" }],
    }),
  ]);

  assert.deepEqual(await fetchAzureDevOpsUser("access-token"), {
    id: "user-id",
    login: "person@example.com",
    name: "Test User",
    email: "person@example.com",
    avatarUrl: null,
  });
  assert.equal(requests.length, 2);
  assert.equal(
    requestHeader(requests[0], "authorization"),
    "Bearer access-token",
  );
});

void test("fetchAzureDevOpsUser accepts org membership from account URI", async (context) => {
  mockFetch(context, [
    Response.json({
      id: "user-id",
      displayName: "Test User",
      publicAlias: "public-alias",
    }),
    Response.json({
      value: [{ accountUri: "https://app.vssps.visualstudio.com/test-org/" }],
    }),
  ]);

  assert.deepEqual(await fetchAzureDevOpsUser("access-token"), {
    id: "user-id",
    login: "public-alias",
    name: "Test User",
    email: null,
    avatarUrl: null,
  });
});

void test("fetchAzureDevOpsUser returns null for malformed profile JSON", async (context) => {
  const requests = mockFetch(context, [
    new Response("{", {
      headers: { "content-type": "application/json" },
      status: 200,
    }),
  ]);

  assert.equal(await fetchAzureDevOpsUser("access-token"), null);
  assert.equal(requests.length, 1);
});

void test("fetchAzureDevOpsUser returns null for malformed org membership JSON", async (context) => {
  const requests = mockFetch(context, [
    Response.json({
      id: "user-id",
      displayName: "Test User",
    }),
    new Response("{", {
      headers: { "content-type": "application/json" },
      status: 200,
    }),
  ]);

  assert.equal(await fetchAzureDevOpsUser("access-token"), null);
  assert.equal(requests.length, 2);
});

void test("fetchAzureDevOpsUserWithDiagnostics reports profile request failures", async (context) => {
  const requests = mockFetch(context, [
    Response.json(
      { error: "unauthorized" },
      {
        status: 401,
      },
    ),
  ]);

  assert.deepEqual(await fetchAzureDevOpsUserWithDiagnostics("access-token"), {
    diagnostics: {
      profileResult: "request_failed",
      profileStatus: 401,
    },
    user: null,
  });
  assert.equal(requests.length, 1);
});

void test("fetchAzureDevOpsUserWithDiagnostics reports org membership misses", async (context) => {
  mockFetch(context, [
    Response.json({
      id: "user-id",
      displayName: "Test User",
    }),
    Response.json({
      value: [{ accountName: "another-org" }],
    }),
    Response.json(
      { message: "forbidden" },
      {
        status: 403,
      },
    ),
  ]);

  assert.deepEqual(await fetchAzureDevOpsUserWithDiagnostics("access-token"), {
    diagnostics: {
      hasProfileId: true,
      orgAccessProbeResult: "request_failed",
      orgAccessProbeStatus: 403,
      orgMembershipAccountCount: 1,
      orgMembershipResult: "not_matched",
      orgMembershipStatus: 200,
      profileResult: "ok",
      profileStatus: 200,
    },
    user: null,
  });
});

void test("fetchAzureDevOpsUserWithDiagnostics accepts configured org access when account names do not match", async (context) => {
  mockFetch(context, [
    Response.json({
      id: "user-id",
      displayName: "Test User",
      publicAlias: "public-alias",
    }),
    Response.json({
      value: [{ accountName: "another-org" }],
    }),
    Response.json({
      queryType: "flat",
      workItems: [],
    }),
  ]);

  assert.deepEqual(await fetchAzureDevOpsUserWithDiagnostics("access-token"), {
    diagnostics: {
      hasProfileId: true,
      orgAccessProbeResult: "ok",
      orgAccessProbeStatus: 200,
      orgMembershipAccountCount: 1,
      orgMembershipResult: "matched_by_configured_org_probe",
      orgMembershipStatus: 200,
      profileResult: "ok",
      profileStatus: 200,
    },
    user: {
      avatarUrl: null,
      email: null,
      id: "user-id",
      login: "public-alias",
      name: "Test User",
    },
  });
});

function mockFetch(context: TestContext, responses: Response[]) {
  const requests: CapturedFetch[] = [];
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (input, init) => {
    requests.push({ input, init });
    await Promise.resolve();
    const response = responses.shift();
    if (!response) {
      assert.fail("unexpected Azure DevOps fetch call");
    }
    return response;
  };

  return requests;
}

function requestHeader(request: CapturedFetch | undefined, name: string) {
  if (request === undefined) {
    assert.fail("request should be captured");
  }
  const headers = request.init?.headers;
  if (!headers || headers instanceof Headers || Array.isArray(headers)) {
    assert.fail("request headers should be a plain object");
  }
  return headers[name];
}

interface CapturedFetch {
  input: RequestInfo | URL;
  init?: RequestInit;
}
