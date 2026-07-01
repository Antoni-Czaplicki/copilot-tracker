import assert from "node:assert/strict";
import { test } from "node:test";

process.env.DATABASE_URL ??=
  "postgres://user:pass@localhost:5432/copilot_tracker";
process.env.NEXT_PUBLIC_APP_URL ??= "https://copilot-tracker.example";

const { normalizeAzureDevOpsOrg } = await import("./config");

void test("normalizeAzureDevOpsOrg accepts org slugs", () => {
  assert.equal(normalizeAzureDevOpsOrg(" test-org "), "test-org");
  assert.equal(normalizeAzureDevOpsOrg("test-org/"), "test-org");
});

void test("normalizeAzureDevOpsOrg accepts dev.azure.com organization URLs", () => {
  assert.equal(
    normalizeAzureDevOpsOrg("https://dev.azure.com/test-org/"),
    "test-org",
  );
  assert.equal(
    normalizeAzureDevOpsOrg("https://dev.azure.com/test-org/Main Project"),
    "test-org",
  );
});

void test("normalizeAzureDevOpsOrg accepts visualstudio.com organization URLs", () => {
  assert.equal(
    normalizeAzureDevOpsOrg("https://test-org.visualstudio.com/"),
    "test-org",
  );
  assert.equal(
    normalizeAzureDevOpsOrg("https://test-org.visualstudio.com/DefaultCollection"),
    "test-org",
  );
});
