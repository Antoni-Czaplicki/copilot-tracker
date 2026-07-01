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

const { fetchAzureDevOpsUser } = await import("./auth");
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
