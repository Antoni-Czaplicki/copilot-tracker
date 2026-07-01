import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
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

void test("readBuildInfo falls back to a generated build-info file", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "copilot-tracker-build-info-"));
  const filePath = path.join(dir, "build-info.json");
  writeFileSync(
    filePath,
    JSON.stringify({
      sha: "file-sha",
      builtAt: "2026-07-01T11:30:00.000Z",
    }),
  );

  assert.deepEqual(
    readBuildInfo({
      COPILOT_TRACKER_BUILD_SHA: "unknown",
      COPILOT_TRACKER_BUILD_TIME: "unknown",
      COPILOT_TRACKER_BUILD_INFO_FILE: filePath,
    }),
    {
      sha: "file-sha",
      builtAt: "2026-07-01T11:30:00.000Z",
    },
  );

  rmSync(dir, { recursive: true, force: true });
});

void test("readBuildInfo prefers explicit environment metadata over generated build-info", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "copilot-tracker-build-info-"));
  const filePath = path.join(dir, "build-info.json");
  writeFileSync(
    filePath,
    JSON.stringify({
      sha: "file-sha",
      builtAt: "2026-07-01T11:30:00.000Z",
    }),
  );

  assert.deepEqual(
    readBuildInfo({
      COPILOT_TRACKER_BUILD_SHA: "explicit-sha",
      COPILOT_TRACKER_BUILD_TIME: "2026-07-01T12:00:00.000Z",
      COPILOT_TRACKER_BUILD_INFO_FILE: filePath,
    }),
    {
      sha: "explicit-sha",
      builtAt: "2026-07-01T12:00:00.000Z",
    },
  );

  rmSync(dir, { recursive: true, force: true });
});
