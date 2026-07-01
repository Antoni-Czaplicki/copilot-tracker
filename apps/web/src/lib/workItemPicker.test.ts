import assert from "node:assert/strict";
import { test } from "node:test";

import {
  canSearchWorkItems,
  emptyWorkItemSearchMessage,
  workItemsFromSearchPayload,
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

void test("emptyWorkItemSearchMessage distinguishes numeric ids from text queries", () => {
  assert.equal(
    emptyWorkItemSearchMessage("  124  "),
    "No Azure DevOps match for this ID",
  );
  assert.equal(
    emptyWorkItemSearchMessage("login"),
    "No Azure DevOps matches",
  );
});

void test("workItemsFromSearchPayload maps valid work-item search results", () => {
  assert.deepEqual(
    workItemsFromSearchPayload({
      workItems: [
        {
          id: 123,
          title: "Fix login",
          state: "Active",
          type: "Bug",
          project: "Tracker",
          assignedTo: "Example User",
          changedAt: "2026-07-01T04:00:00.000Z",
          url: "https://example.com/work-items/123",
        },
      ],
    }),
    [
      {
        id: 123,
        title: "Fix login",
        state: "Active",
        type: "Bug",
        project: "Tracker",
        assignedTo: "Example User",
        changedAt: "2026-07-01T04:00:00.000Z",
        url: "https://example.com/work-items/123",
      },
    ],
  );
});

void test("workItemsFromSearchPayload filters malformed work-item search results", () => {
  assert.deepEqual(
    workItemsFromSearchPayload({
      workItems: [
        { id: 123, title: "Valid", state: 12 },
        { id: "124", title: "Wrong id" },
        { id: -1, title: "Negative id" },
        { id: 2_147_483_648, title: "Too large id" },
        { id: 125, title: null },
        null,
      ],
    }),
    [
      {
        id: 123,
        title: "Valid",
        state: null,
        type: null,
        project: null,
        assignedTo: null,
        changedAt: null,
        url: null,
      },
    ],
  );
  assert.deepEqual(workItemsFromSearchPayload(null), []);
  assert.deepEqual(workItemsFromSearchPayload({ workItems: "oops" }), []);
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
