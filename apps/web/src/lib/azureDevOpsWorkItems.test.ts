import assert from "node:assert/strict";
import { test } from "node:test";
import type { TestContext } from "node:test";
import { NextRequest } from "next/server";

process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/copilot_tracker";
process.env.NEXT_PUBLIC_APP_URL ??= "https://copilot-tracker.example.com";
process.env.AZURE_DEVOPS_CLIENT_ID ??= "placeholder-client-id";
process.env.AZURE_DEVOPS_CLIENT_SECRET ??= "placeholder-client-secret";
process.env.AZURE_DEVOPS_ORG ??= "placeholder-org";

const {
  AzureDevOpsWorkItemsError,
  azureDevOpsWorkItemsClientStatus,
  buildWiqlQueries,
  searchAzureDevOpsWorkItems,
} = await import("./azureDevOpsWorkItems");
const workItemsRoute = await import("../app/api/azure-devops/work-items/route");
const originalFetch = globalThis.fetch;

void test("buildWiqlQueries leaves numeric work-item ids to direct batch lookup", () => {
  assert.deepEqual(buildWiqlQueries("000123", 99), []);
  assert.deepEqual(buildWiqlQueries("42", 0), []);
});

void test("buildWiqlQueries rejects unsafe numeric ids", () => {
  assert.deepEqual(buildWiqlQueries("0", 20), []);
  assert.deepEqual(buildWiqlQueries("2147483648", 20), []);
  assert.deepEqual(buildWiqlQueries("999999999999999999999999", 20), []);
});

void test("buildWiqlQueries escapes text queries and falls back to default limit", () => {
  const queries = buildWiqlQueries("can't login", Number.NaN);

  assert.equal(queries.length, 2);
  assert.match(queries[0] ?? "", /SELECT TOP 20/);
  assert.match(queries[0] ?? "", /CONTAINS WORDS 'can''t login'/);
  assert.match(queries[1] ?? "", /CONTAINS 'can''t login'/);
});

void test("searchAzureDevOpsWorkItems uses Azure Search and maps result fields", async (context) => {
  const requests = mockFetch(context, [
    Response.json({
      results: [
        {
          project: { name: "Main Project" },
          fields: {
            "system.id": "123",
            "system.title": "Fix login",
            "system.state": "Active",
            "system.workitemtype": "Bug",
            "system.assignedto": "A Person",
            "system.changeddate": "2026-07-01T00:00:00.000Z",
            "system.tags": "auth; urgent",
          },
        },
        {
          fields: {
            "system.id": "ignored",
          },
        },
        {
          fields: {
            "system.id": "-1",
          },
        },
        {
          fields: {
            "system.id": "2147483648",
          },
        },
        {
          fields: {
            "system.id": "456",
          },
          url: "https://dev.azure.com/fallback/_apis/wit/workItems/456",
        },
      ],
    }),
  ]);

  const items = await searchAzureDevOpsWorkItems({
    accessToken: "access-token",
    query: " login ",
    limit: 5,
  });

  assert.deepEqual(items, [
    {
      id: 123,
      title: "Fix login",
      state: "Active",
      type: "Bug",
      project: "Main Project",
      assignedTo: "A Person",
      changedAt: "2026-07-01T00:00:00.000Z",
      tags: "auth; urgent",
      url: "https://dev.azure.com/placeholder-org/Main%20Project/_workitems/edit/123",
    },
    {
      id: 456,
      title: "Work item 456",
      state: null,
      type: null,
      project: null,
      assignedTo: null,
      changedAt: null,
      tags: null,
      url: "https://dev.azure.com/fallback/_apis/wit/workItems/456",
    },
  ]);
  assert.equal(requests.length, 1);
  assert.equal(
    String(requests[0]?.input),
    "https://almsearch.dev.azure.com/placeholder-org/_apis/search/workitemsearchresults?api-version=7.1",
  );
  assert.equal(
    requestHeader(requests[0], "authorization"),
    "Bearer access-token",
  );
  assert.deepEqual(requestJson(requests[0]), {
    searchText: "login",
    "$skip": 0,
    "$top": 5,
    filters: null,
    includeFacets: false,
  });
});

void test("searchAzureDevOpsWorkItems fetches numeric ids directly without WIQL", async (context) => {
  const requests = mockFetch(context, [
    Response.json({
      value: [
        {
          id: 17_198,
          fields: {
            "System.Title": "Existing task",
            "System.TeamProject": "Main Project",
            "System.Tags": "support",
          },
        },
      ],
    }),
  ]);

  const items = await searchAzureDevOpsWorkItems({
    accessToken: "access-token",
    query: "  17198  ",
  });

  assert.deepEqual(items, [
    {
      id: 17_198,
      title: "Existing task",
      state: null,
      type: null,
      project: "Main Project",
      assignedTo: null,
      changedAt: null,
      tags: "support",
      url: "https://dev.azure.com/placeholder-org/Main%20Project/_workitems/edit/17198",
    },
  ]);
  assert.equal(requests.length, 1);
  assert.equal(
    String(requests[0]?.input),
    "https://dev.azure.com/placeholder-org/_apis/wit/workitemsbatch?api-version=7.1",
  );
  assert.deepEqual(requestJson(requests[0]).ids, [17_198]);
  assert.equal(requestJson(requests[0]).errorPolicy, "Omit");
});

void test("searchAzureDevOpsWorkItems promotes marked ids alongside text search results", async (context) => {
  const requests = mockFetch(context, [
    Response.json({
      value: [
        {
          id: 17_198,
          fields: {
            "System.Title": "Direct task",
          },
        },
      ],
    }),
    Response.json({
      results: [
        {
          fields: {
            "system.id": "17198",
            "system.title": "ignored malformed duplicate",
          },
        },
        {
          project: { name: "Main Project" },
          fields: {
            "system.id": "42",
            "system.title": "Search task",
            "system.tags": "frontend",
          },
        },
      ],
    }),
  ]);

  const items = await searchAzureDevOpsWorkItems({
    accessToken: "access-token",
    query: "AB#17198 frontend",
  });

  assert.deepEqual(
    items.map((item) => item.id),
    [17_198, 42],
  );
  assert.equal(items[1]?.tags, "frontend");
  assert.equal(requests.length, 2);
  assert.deepEqual(requestJson(requests[0]).ids, [17_198]);
  assert.equal(
    String(requests[1]?.input),
    "https://almsearch.dev.azure.com/placeholder-org/_apis/search/workitemsearchresults?api-version=7.1",
  );
});

void test("searchAzureDevOpsWorkItems falls back to contains query after unsafe words query", async (context) => {
  const requests = mockFetch(context, [
    new Response("search unavailable", { status: 404 }),
    new Response("bad wiql", { status: 400 }),
    Response.json({ workItems: [{ id: 789 }] }),
    Response.json({
      value: [
        {
          id: 789,
          fields: {
            "System.Title": "Fallback result",
          },
        },
      ],
    }),
  ]);

  const items = await searchAzureDevOpsWorkItems({
    accessToken: "access-token",
    query: "quoted title",
    limit: 10,
  });

  assert.equal(items[0]?.id, 789);
  assert.equal(requests.length, 4);
  const wordsQuery = requestJson(requests[1]).query;
  const containsQuery = requestJson(requests[2]).query;
  if (typeof wordsQuery !== "string") {
    assert.fail("words query should be a string");
  }
  if (typeof containsQuery !== "string") {
    assert.fail("contains query should be a string");
  }
  assert.match(
    wordsQuery,
    /CONTAINS WORDS 'quoted title'/,
  );
  assert.match(
    containsQuery,
    /CONTAINS 'quoted title'/,
  );
});

void test("searchAzureDevOpsWorkItems falls back to contains query after empty words results", async (context) => {
  const requests = mockFetch(context, [
    Response.json({ results: [] }),
    Response.json({ workItems: [] }),
    Response.json({ workItems: [{ id: 321 }] }),
    Response.json({
      value: [
        {
          id: 321,
          fields: {
            "System.Title": "Substring result",
          },
        },
      ],
    }),
  ]);

  const items = await searchAzureDevOpsWorkItems({
    accessToken: "access-token",
    query: "substring",
    limit: 10,
  });

  assert.equal(items[0]?.id, 321);
  assert.equal(items.length, 1);
  assert.equal(requests.length, 4);
  const wordsQuery = requestJson(requests[1]).query;
  const containsQuery = requestJson(requests[2]).query;
  if (typeof wordsQuery !== "string") {
    assert.fail("words query should be a string");
  }
  if (typeof containsQuery !== "string") {
    assert.fail("contains query should be a string");
  }
  assert.match(
    wordsQuery,
    /CONTAINS WORDS 'substring'/,
  );
  assert.match(
    containsQuery,
    /CONTAINS 'substring'/,
  );
  assert.deepEqual(requestJson(requests[3]).ids, [321]);
});

void test("searchAzureDevOpsWorkItems returns empty after all successful text queries are empty", async (context) => {
  const requests = mockFetch(context, [
    Response.json({ results: [] }),
    Response.json({ workItems: [] }),
    Response.json({ workItems: [] }),
  ]);

  const items = await searchAzureDevOpsWorkItems({
    accessToken: "access-token",
    query: "missing",
  });

  assert.deepEqual(items, []);
  assert.equal(requests.length, 3);
});

void test("searchAzureDevOpsWorkItems maps malformed successful Search JSON to a typed error", async (context) => {
  const requests = mockFetch(context, [
    new Response("{", {
      headers: { "content-type": "application/json" },
    }),
  ]);

  await assert.rejects(
    searchAzureDevOpsWorkItems({
      accessToken: "access-token",
      query: "login",
    }),
    (error: unknown) =>
      error instanceof AzureDevOpsWorkItemsError &&
      error.code === "azure_devops_bad_response" &&
      error.status === 502,
  );
  assert.equal(requests.length, 1);
});

void test("searchAzureDevOpsWorkItems maps malformed successful WIQL JSON to a typed error", async (context) => {
  const requests = mockFetch(context, [
    Response.json({ results: [] }),
    new Response("{", {
      headers: { "content-type": "application/json" },
    }),
  ]);

  await assert.rejects(
    searchAzureDevOpsWorkItems({
      accessToken: "access-token",
      query: "login",
    }),
    (error: unknown) =>
      error instanceof AzureDevOpsWorkItemsError &&
      error.code === "azure_devops_bad_response" &&
      error.status === 502,
  );
  assert.equal(requests.length, 2);
});

void test("searchAzureDevOpsWorkItems maps malformed successful batch JSON to a typed error", async (context) => {
  const requests = mockFetch(context, [
    Response.json({ results: [] }),
    Response.json({ workItems: [{ id: 123 }] }),
    new Response("{", {
      headers: { "content-type": "application/json" },
    }),
  ]);

  await assert.rejects(
    searchAzureDevOpsWorkItems({
      accessToken: "access-token",
      query: "login",
    }),
    (error: unknown) =>
      error instanceof AzureDevOpsWorkItemsError &&
      error.code === "azure_devops_bad_response" &&
      error.status === 502,
  );
  assert.equal(requests.length, 3);
});

void test("searchAzureDevOpsWorkItems tolerates missing successful upstream result arrays", async (context) => {
  const requests = mockFetch(context, [
    Response.json({ results: null }),
    Response.json({ workItems: null }),
    Response.json({ workItems: null }),
  ]);

  const items = await searchAzureDevOpsWorkItems({
    accessToken: "access-token",
    query: "login",
  });

  assert.deepEqual(items, []);
  assert.equal(requests.length, 3);
});

void test("searchAzureDevOpsWorkItems maps repeated rate limits to a typed error", async (context) => {
  const requests = mockFetch(context, [
    new Response("rate limited", {
      headers: { "retry-after": "0" },
      status: 429,
    }),
    new Response("rate limited", {
      headers: { "retry-after": "0" },
      status: 429,
    }),
    new Response("rate limited", {
      headers: { "retry-after": "0" },
      status: 429,
    }),
  ]);

  await assert.rejects(
    searchAzureDevOpsWorkItems({
      accessToken: "access-token",
      query: "login",
    }),
    (error: unknown) =>
      error instanceof AzureDevOpsWorkItemsError &&
      error.code === "azure_devops_rate_limited" &&
      error.status === 429,
  );
  assert.equal(requests.length, 3);
});

void test("azureDevOpsWorkItemsClientStatus preserves auth and rate-limit statuses", () => {
  assert.equal(azureDevOpsWorkItemsClientStatus(401), 401);
  assert.equal(azureDevOpsWorkItemsClientStatus(403), 403);
  assert.equal(azureDevOpsWorkItemsClientStatus(429), 429);
});

void test("azureDevOpsWorkItemsClientStatus maps other upstream errors to bad gateway", () => {
  assert.equal(azureDevOpsWorkItemsClientStatus(400), 502);
  assert.equal(azureDevOpsWorkItemsClientStatus(404), 502);
  assert.equal(azureDevOpsWorkItemsClientStatus(500), 502);
});

void test("work-items route returns an empty result for blank queries without auth", async () => {
  const response = await workItemsRoute.GET(
    new NextRequest(
      "https://copilot-tracker.example.com/api/azure-devops/work-items?query=%20%20",
    ),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { workItems: [] });
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

function requestJson(request: CapturedFetch | undefined) {
  if (request === undefined) {
    assert.fail("request should be captured");
  }
  const body = request.init?.body;
  if (typeof body !== "string") {
    assert.fail("request body should be JSON text");
  }

  const parsed: unknown = JSON.parse(body);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    assert.fail("request body should be a JSON object");
  }

  return parsed as Record<string, unknown>;
}

interface CapturedFetch {
  input: RequestInfo | URL;
  init?: RequestInit;
}
