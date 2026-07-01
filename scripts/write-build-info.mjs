#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const unknown = "unknown";
const outputPath = path.resolve(process.argv[2] ?? "apps/web/build-info.json");

const buildInfo = {
  sha:
    firstKnown(
      process.env.COPILOT_TRACKER_BUILD_SHA,
      process.env.SOURCE_COMMIT,
      process.env.GITHUB_SHA,
      process.env.VERCEL_GIT_COMMIT_SHA,
      process.env.RAILWAY_GIT_COMMIT_SHA,
      process.env.COMMIT_SHA,
      readGitHeadSha(process.cwd()),
    ) ?? unknown,
  builtAt:
    firstKnown(
      process.env.COPILOT_TRACKER_BUILD_TIME,
      process.env.BUILD_TIME,
      sourceDateEpochToIso(process.env.SOURCE_DATE_EPOCH),
    ) ?? new Date().toISOString(),
};

mkdirSync(path.dirname(outputPath), { recursive: true });
writeBuildInfo(outputPath, buildInfo);

console.log(
  `Wrote build info to ${outputPath} (sha: ${shortSha(buildInfo.sha)}, builtAt: ${buildInfo.builtAt})`,
);

function writeBuildInfo(filePath, info) {
  if (filePath.endsWith(".ts")) {
    writeFileSync(
      filePath,
      `export const generatedBuildInfo = ${JSON.stringify(info, null, 2)} as const;\n`,
    );
    return;
  }

  writeFileSync(filePath, `${JSON.stringify(info, null, 2)}\n`);
}

function shortSha(sha) {
  const normalized = normalize(sha);
  return normalized ? normalized.slice(0, 12) : unknown;
}

function firstKnown(...values) {
  for (const value of values) {
    const normalized = normalize(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalize(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized || normalized.toLowerCase() === unknown) {
    return null;
  }

  return normalized;
}

function sourceDateEpochToIso(value) {
  const normalized = normalize(value);
  if (!normalized) {
    return null;
  }

  const seconds = Number(normalized);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
}

function readGitHeadSha(cwd) {
  const gitDir = resolveGitDir(cwd);
  if (!gitDir) {
    return null;
  }

  const head = readText(path.join(gitDir, "HEAD"));
  if (!head) {
    return null;
  }

  if (!head.startsWith("ref:")) {
    return head;
  }

  const ref = head.slice("ref:".length).trim();
  return readText(path.join(gitDir, ref)) ?? readPackedRef(gitDir, ref);
}

function resolveGitDir(cwd) {
  const dotGit = path.join(cwd, ".git");
  if (!existsSync(dotGit)) {
    return null;
  }

  const stat = statSync(dotGit);
  if (stat.isDirectory()) {
    return dotGit;
  }

  const pointer = readText(dotGit);
  const gitdirPrefix = "gitdir:";
  if (!pointer?.startsWith(gitdirPrefix)) {
    return null;
  }

  const target = pointer.slice(gitdirPrefix.length).trim();
  return path.isAbsolute(target) ? target : path.resolve(cwd, target);
}

function readPackedRef(gitDir, ref) {
  const packedRefs = readText(path.join(gitDir, "packed-refs"));
  if (!packedRefs) {
    return null;
  }

  for (const line of packedRefs.split("\n")) {
    if (line.startsWith("#") || line.startsWith("^")) {
      continue;
    }

    const [sha, packedRef] = line.trim().split(/\s+/, 2);
    if (packedRef === ref) {
      return sha;
    }
  }

  return null;
}

function readText(filePath) {
  try {
    return readFileSync(filePath, "utf8").trim();
  } catch {
    return null;
  }
}
