import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const scriptPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "write-build-info.mjs",
);

test("write-build-info reads the current branch SHA from minimal git refs", () => {
  const repo = createTempRepo();
  const sha = "0123456789abcdef0123456789abcdef01234567";
  writeFileSync(path.join(repo, ".git/HEAD"), "ref: refs/heads/main\n");
  mkdirSync(path.join(repo, ".git/refs/heads"), { recursive: true });
  writeFileSync(path.join(repo, ".git/refs/heads/main"), `${sha}\n`);

  const outputPath = path.join(repo, "apps/web/build-info.json");
  execFileSync(process.execPath, [scriptPath, outputPath], {
    cwd: repo,
    env: {},
  });

  const buildInfo = JSON.parse(readFileSync(outputPath, "utf8"));
  assert.equal(buildInfo.sha, sha);
  assert.match(buildInfo.builtAt, /^\d{4}-\d{2}-\d{2}T/);

  rmSync(repo, { recursive: true, force: true });
});

test("write-build-info reads packed refs when branch ref files are absent", () => {
  const repo = createTempRepo();
  const sha = "fedcba9876543210fedcba9876543210fedcba98";
  writeFileSync(path.join(repo, ".git/HEAD"), "ref: refs/heads/main\n");
  writeFileSync(
    path.join(repo, ".git/packed-refs"),
    `# pack-refs with: peeled fully-peeled sorted\n${sha} refs/heads/main\n`,
  );

  const outputPath = path.join(repo, "build-info.json");
  execFileSync(process.execPath, [scriptPath, outputPath], {
    cwd: repo,
    env: {},
  });

  const buildInfo = JSON.parse(readFileSync(outputPath, "utf8"));
  assert.equal(buildInfo.sha, sha);

  rmSync(repo, { recursive: true, force: true });
});

test("write-build-info prefers explicit metadata over git refs", () => {
  const repo = createTempRepo();
  writeFileSync(path.join(repo, ".git/HEAD"), "ref: refs/heads/main\n");
  mkdirSync(path.join(repo, ".git/refs/heads"), { recursive: true });
  writeFileSync(
    path.join(repo, ".git/refs/heads/main"),
    "0123456789abcdef0123456789abcdef01234567\n",
  );

  const outputPath = path.join(repo, "build-info.json");
  execFileSync(process.execPath, [scriptPath, outputPath], {
    cwd: repo,
    env: {
      COPILOT_TRACKER_BUILD_SHA: "explicit-sha",
      SOURCE_DATE_EPOCH: "1782864000",
    },
  });

  assert.deepEqual(JSON.parse(readFileSync(outputPath, "utf8")), {
    sha: "explicit-sha",
    builtAt: "2026-07-01T00:00:00.000Z",
  });

  rmSync(repo, { recursive: true, force: true });
});

test("write-build-info can generate a TypeScript module for Next builds", () => {
  const repo = createTempRepo();
  const sha = "1111111111111111111111111111111111111111";
  writeFileSync(path.join(repo, ".git/HEAD"), `${sha}\n`);

  const outputPath = path.join(
    repo,
    "apps/web/src/generated/buildInfo.generated.ts",
  );
  execFileSync(process.execPath, [scriptPath, outputPath], {
    cwd: repo,
    env: {
      COPILOT_TRACKER_BUILD_TIME: "2026-07-01T12:30:00.000Z",
    },
  });

  assert.equal(
    readFileSync(outputPath, "utf8"),
    `export const generatedBuildInfo = {
  "sha": "${sha}",
  "builtAt": "2026-07-01T12:30:00.000Z"
} as const;\n`,
  );

  rmSync(repo, { recursive: true, force: true });
});

function createTempRepo() {
  const repo = mkdtempSync(path.join(tmpdir(), "copilot-tracker-build-info-"));
  mkdirSync(path.join(repo, ".git"), { recursive: true });
  return repo;
}
