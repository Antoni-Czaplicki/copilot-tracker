import assert from "node:assert/strict";
import { test } from "node:test";

import { dashboardTaskPageHref } from "./dashboardLinks";

void test("dashboardTaskPageHref preserves focused sessions while paging tasks", () => {
  assert.equal(
    dashboardTaskPageHref("/dashboard", 3, "session 1/2"),
    "/dashboard?taskPage=3&sessionId=session+1%2F2",
  );
});

void test("dashboardTaskPageHref omits sessionId when no session is focused", () => {
  assert.equal(dashboardTaskPageHref("/", 2, null), "/?taskPage=2");
});
