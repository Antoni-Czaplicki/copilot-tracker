import { readFileSync } from "node:fs";
import path from "node:path";

type BuildInfoEnv = Record<string, string | undefined>;

const unknown = "unknown";

export function readBuildInfo(env: BuildInfoEnv = process.env) {
  const fileInfo = readBuildInfoFile(env);

  return {
    sha:
      firstKnown(
        env.COPILOT_TRACKER_BUILD_SHA,
        env.SOURCE_COMMIT,
        env.GITHUB_SHA,
        env.VERCEL_GIT_COMMIT_SHA,
        env.RAILWAY_GIT_COMMIT_SHA,
        env.COMMIT_SHA,
        fileInfo.sha,
      ) ?? unknown,
    builtAt:
      firstKnown(
        env.COPILOT_TRACKER_BUILD_TIME,
        env.BUILD_TIME,
        sourceDateEpochToIso(env.SOURCE_DATE_EPOCH),
        fileInfo.builtAt,
      ) ?? unknown,
  };
}

function readBuildInfoFile(env: BuildInfoEnv) {
  for (const filePath of buildInfoFilePaths(env)) {
    try {
      const payload = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
      if (isRecord(payload)) {
        return {
          sha: stringValue(payload.sha),
          builtAt: stringValue(payload.builtAt),
        };
      }
    } catch {
      // Missing or malformed build-info files should not break health checks.
    }
  }

  return {};
}

function buildInfoFilePaths(env: BuildInfoEnv) {
  const configuredPath = normalize(env.COPILOT_TRACKER_BUILD_INFO_FILE);
  const paths = configuredPath
    ? [path.resolve(/* turbopackIgnore: true */ configuredPath)]
    : [];

  if (env === process.env) {
    paths.push(
      path.join(/* turbopackIgnore: true */ process.cwd(), "build-info.json"),
      path.join(
        /* turbopackIgnore: true */ process.cwd(),
        "apps/web/build-info.json",
      ),
    );
  }

  return paths;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function firstKnown(...values: (string | null | undefined)[]) {
  for (const value of values) {
    const normalized = normalize(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalize(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized || normalized.toLowerCase() === unknown) {
    return null;
  }

  return normalized;
}

function sourceDateEpochToIso(value: string | undefined) {
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
