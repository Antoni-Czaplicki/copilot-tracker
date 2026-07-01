type BuildInfoEnv = Record<string, string | undefined>;

const unknown = "unknown";

export function readBuildInfo(env: BuildInfoEnv = process.env) {
  return {
    sha:
      firstKnown(
        env.COPILOT_TRACKER_BUILD_SHA,
        env.SOURCE_COMMIT,
        env.GITHUB_SHA,
        env.VERCEL_GIT_COMMIT_SHA,
        env.RAILWAY_GIT_COMMIT_SHA,
        env.COMMIT_SHA,
      ) ?? unknown,
    builtAt:
      firstKnown(
        env.COPILOT_TRACKER_BUILD_TIME,
        env.BUILD_TIME,
        sourceDateEpochToIso(env.SOURCE_DATE_EPOCH),
      ) ?? unknown,
  };
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
