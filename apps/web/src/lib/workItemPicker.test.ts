import assert from "node:assert/strict";
import { test } from "node:test";

import type { WorkItemSearchItem } from "./workItemPicker";
import {
  canSearchWorkItems,
  emptyWorkItemSearchMessage,
  isTerminalWorkItemState,
  nextWorkItemActiveIndex,
  safeWorkItemUrl,
  sortWorkItemSearchItems,
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

void test("sortWorkItemSearchItems keeps terminal work items after active matches", () => {
  const completed = workItem({ id: 1, state: "Completed" });
  const active = workItem({ id: 2, state: "Active" });
  const accepted = workItem({ id: 3, state: "Accepted" });
  const proposed = workItem({ id: 4, state: "Proposed" });

  assert.deepEqual(
    sortWorkItemSearchItems([completed, active, accepted, proposed]).map(
      (item) => item.id,
    ),
    [2, 4, 1, 3],
  );
});

void test("isTerminalWorkItemState recognizes completed and accepted states", () => {
  assert.equal(isTerminalWorkItemState("Completed"), true);
  assert.equal(isTerminalWorkItemState("accepted"), true);
  assert.equal(isTerminalWorkItemState("Active"), false);
  assert.equal(isTerminalWorkItemState(null), false);
});

void test("safeWorkItemUrl allows browser URLs and rejects unsafe schemes", () => {
  assert.equal(
    safeWorkItemUrl("https://dev.azure.com/org/project/_workitems/edit/123"),
    "https://dev.azure.com/org/project/_workitems/edit/123",
  );
  assert.equal(safeWorkItemUrl("javascript:alert(1)"), null);
  assert.equal(safeWorkItemUrl("not a url"), null);
  assert.equal(safeWorkItemUrl(null), null);
});

void test("nextWorkItemActiveIndex moves through listbox results within bounds", () => {
  assert.equal(
    nextWorkItemActiveIndex({
      currentIndex: 0,
      itemCount: 3,
      key: "ArrowDown",
    }),
    1,
  );
  assert.equal(
    nextWorkItemActiveIndex({
      currentIndex: 2,
      itemCount: 3,
      key: "ArrowDown",
    }),
    2,
  );
  assert.equal(
    nextWorkItemActiveIndex({
      currentIndex: 2,
      itemCount: 3,
      key: "ArrowUp",
    }),
    1,
  );
  assert.equal(
    nextWorkItemActiveIndex({
      currentIndex: 0,
      itemCount: 3,
      key: "ArrowUp",
    }),
    0,
  );
});

function workItem(
  overrides: Partial<WorkItemSearchItem> & Pick<WorkItemSearchItem, "id">,
): WorkItemSearchItem {
  return {
    id: overrides.id,
    title: overrides.title ?? `Task ${overrides.id}`,
    state: overrides.state ?? null,
    type: overrides.type ?? null,
    project: overrides.project ?? null,
    assignedTo: overrides.assignedTo ?? null,
    changedAt: overrides.changedAt ?? null,
    tags: overrides.tags ?? null,
    url: overrides.url ?? null,
  };
}

void test("nextWorkItemActiveIndex clamps stale or invalid active indexes", () => {
  assert.equal(
    nextWorkItemActiveIndex({
      currentIndex: 99,
      itemCount: 3,
      key: "ArrowDown",
    }),
    2,
  );
  assert.equal(
    nextWorkItemActiveIndex({
      currentIndex: -4,
      itemCount: 3,
      key: "ArrowUp",
    }),
    0,
  );
  assert.equal(
    nextWorkItemActiveIndex({
      currentIndex: 1,
      itemCount: 0,
      key: "ArrowDown",
    }),
    0,
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
          tags: "auth; urgent",
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
        tags: "auth; urgent",
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
        tags: null,
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
