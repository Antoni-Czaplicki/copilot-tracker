import assert from "node:assert/strict";
import { test } from "node:test";

process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/copilot_tracker";
process.env.NEXT_PUBLIC_APP_URL ??= "https://copilot-tracker.example.com";
process.env.AZURE_DEVOPS_CLIENT_ID ??= "placeholder-client-id";
process.env.AZURE_DEVOPS_CLIENT_SECRET ??= "placeholder-client-secret";
process.env.AZURE_DEVOPS_ORG ??= "placeholder-org";

void test("buildWiqlQueries creates safe numeric work-item id lookups", async () => {
  const { buildWiqlQueries } = await import("./azureDevOpsWorkItems");

  assert.deepEqual(buildWiqlQueries("000123", 99), [
    "SELECT TOP 50 [System.Id] FROM WorkItems WHERE [System.Id] = 123",
  ]);
  assert.deepEqual(buildWiqlQueries("42", 0), [
    "SELECT TOP 1 [System.Id] FROM WorkItems WHERE [System.Id] = 42",
  ]);
});

void test("buildWiqlQueries rejects unsafe numeric ids", async () => {
  const { buildWiqlQueries } = await import("./azureDevOpsWorkItems");

  assert.deepEqual(buildWiqlQueries("0", 20), []);
  assert.deepEqual(buildWiqlQueries("2147483648", 20), []);
  assert.deepEqual(buildWiqlQueries("999999999999999999999999", 20), []);
});

void test("buildWiqlQueries escapes text queries and falls back to default limit", async () => {
  const { buildWiqlQueries } = await import("./azureDevOpsWorkItems");
  const queries = buildWiqlQueries("can't login", Number.NaN);

  assert.equal(queries.length, 2);
  assert.match(queries[0] ?? "", /SELECT TOP 20/);
  assert.match(queries[0] ?? "", /CONTAINS WORDS 'can''t login'/);
  assert.match(queries[1] ?? "", /CONTAINS 'can''t login'/);
});
