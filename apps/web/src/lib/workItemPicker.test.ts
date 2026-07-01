import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canSearchWorkItems,
  workItemSearchErrorMessage,
} from "./workItemPicker";

void test("canSearchWorkItems allows multi-character text and digit-only ids", () => {
  assert.equal(canSearchWorkItems("lo"), true);
  assert.equal(canSearchWorkItems("  login  "), true);
  assert.equal(canSearchWorkItems("7"), true);
});

void test("canSearchWorkItems blocks one-character non-id searches", () => {
  assert.equal(canSearchWorkItems("l"), false);
  assert.equal(canSearchWorkItems(" "), false);
});

void test("workItemSearchErrorMessage maps Azure DevOps API error codes", async () => {
  assert.equal(
    await workItemSearchErrorMessage(
      Response.json({ error: "azure_devops_forbidden" }, { status: 403 }),
    ),
    "Azure DevOps work-item access is missing.",
  );
  assert.equal(
    await workItemSearchErrorMessage(
      Response.json({ error: "azure_devops_unauthorized" }, { status: 401 }),
    ),
    "Sign in to Azure DevOps again.",
  );
  assert.equal(
    await workItemSearchErrorMessage(
      Response.json({ error: "azure_devops_rate_limited" }, { status: 429 }),
    ),
    "Azure DevOps rate limit reached.",
  );
});

void test("workItemSearchErrorMessage falls back to status for unknown or non-JSON responses", async () => {
  assert.equal(
    await workItemSearchErrorMessage(
      Response.json({ error: "other" }, { status: 502 }),
    ),
    "Search failed (502)",
  );
  assert.equal(
    await workItemSearchErrorMessage(new Response("oops", { status: 500 })),
    "Search failed (500)",
  );
});
