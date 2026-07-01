import assert from "node:assert/strict";
import { test } from "node:test";

import { readBuildInfo } from "./buildInfo";

void test("readBuildInfo prefers explicit Copilot Tracker build metadata", () => {
  assert.deepEqual(
    readBuildInfo({
      COPILOT_TRACKER_BUILD_SHA: " explicit-sha ",
      COPILOT_TRACKER_BUILD_TIME: " 2026-07-01T00:00:00Z ",
      GITHUB_SHA: "github-sha",
      SOURCE_DATE_EPOCH: "1782864000",
    }),
    {
      sha: "explicit-sha",
      builtAt: "2026-07-01T00:00:00Z",
    },
  );
});

void test("readBuildInfo falls back to common source metadata env names", () => {
  assert.deepEqual(
    readBuildInfo({
      COPILOT_TRACKER_BUILD_SHA: "unknown",
      GITHUB_SHA: "github-sha",
      SOURCE_DATE_EPOCH: "1782864000",
    }),
    {
      sha: "github-sha",
      builtAt: "2026-07-01T00:00:00.000Z",
    },
  );
});

void test("readBuildInfo returns unknown for blank or invalid metadata", () => {
  assert.deepEqual(
    readBuildInfo({
      COPILOT_TRACKER_BUILD_SHA: " ",
      COPILOT_TRACKER_BUILD_TIME: "unknown",
      SOURCE_DATE_EPOCH: "not-a-number",
    }),
    {
      sha: "unknown",
      builtAt: "unknown",
    },
  );
});
