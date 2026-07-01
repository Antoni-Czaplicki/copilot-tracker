#!/usr/bin/env node

const defaultBaseUrl = "https://copilot-tracker.antek.page";
const options = parseArgs(process.argv.slice(2));
const allowKnownStale = options.allowKnownStale;
const baseUrl = normalizeBaseUrl(options.baseUrl ?? defaultBaseUrl);
const expectedAuthCode = "access_denied";
const results = [];

try {
  await smokeHealth();
  await smokeAzureAuthStart();
  await smokeProviderErrorCallback();
  writeResults();
} catch (error) {
  writeResults();
  console.error(`FAIL production smoke crashed: ${errorMessage(error)}`);
  process.exitCode = 1;
}

async function smokeHealth() {
  const response = await fetchUrl("/api/health");
  const payload = await response.json().catch(() => null);
  const health = isRecord(payload) ? payload : {};
  const database = isRecord(health.database) ? health.database : {};
  const version = isRecord(health.version) ? health.version : {};
  const sha = stringField(version, "sha");
  const builtAt = stringField(version, "builtAt");
  const cacheControl = response.headers.get("cache-control") ?? "";

  assertHard(
    response.status === 200,
    `/api/health returns HTTP 200 (got ${response.status})`,
  );
  assertHard(health.ok === true, "/api/health reports ok=true");
  assertHard(database.ok === true, "/api/health reports database.ok=true");
  assertFresh(
    Boolean(sha) && sha !== "unknown",
    `/api/health exposes a non-unknown version.sha (got ${formatValue(sha)})`,
  );
  if (options.expectedSha) {
    assertFresh(
      shaMatches(sha, options.expectedSha),
      `/api/health version.sha matches expected deployed SHA ${options.expectedSha} (got ${formatValue(
        sha,
      )})`,
    );
  }
  assertFresh(
    Boolean(builtAt) && builtAt !== "unknown",
    `/api/health exposes a non-unknown version.builtAt (got ${formatValue(
      builtAt,
    )})`,
  );
  assertFresh(
    cacheControl.toLowerCase().includes("no-store"),
    `/api/health sends Cache-Control: no-store (got ${formatValue(
      cacheControl,
    )})`,
  );
}

async function smokeAzureAuthStart() {
  const response = await fetchUrl("/api/auth/azure-devops", {
    redirect: "manual",
  });
  const location = response.headers.get("location") ?? "";
  const redirectUrl = parseUrl(location);
  const scope = redirectUrl?.searchParams.get("scope") ?? "";

  assertHard(
    response.status >= 300 && response.status < 400,
    `/api/auth/azure-devops redirects (got ${response.status})`,
  );
  assertHard(
    redirectUrl?.host === "login.microsoftonline.com",
    `/api/auth/azure-devops redirects to Microsoft (got ${formatValue(
      redirectUrl?.host,
    )})`,
  );
  assertHard(
    redirectUrl?.searchParams.has("state") === true,
    "Azure auth redirect includes state",
  );
  assertHard(
    redirectUrl?.searchParams.has("code_challenge") === true,
    "Azure auth redirect includes PKCE code_challenge",
  );
  assertHard(
    redirectUrl?.searchParams.get("code_challenge_method") === "S256",
    "Azure auth redirect uses PKCE S256",
  );
  assertHard(
    scope.includes("offline_access"),
    "Azure auth redirect requests offline_access",
  );
  assertHard(
    scope.includes("vso.profile"),
    "Azure auth redirect requests vso.profile",
  );
  assertHard(scope.includes("vso.work"), "Azure auth redirect requests vso.work");
}

async function smokeProviderErrorCallback() {
  const response = await fetchUrl(
    "/api/auth/callback/azure-devops?error=access_denied&error_description=do-not-reflect",
    { redirect: "manual" },
  );
  const redirectUrl = new URL(response.headers.get("location") ?? "/", baseUrl);

  assertHard(
    response.status >= 300 && response.status < 400,
    `provider-error callback redirects (got ${response.status})`,
  );
  assertHard(
    redirectUrl.pathname === "/",
    `provider-error callback redirects to home (got ${redirectUrl.pathname})`,
  );
  assertHard(
    redirectUrl.searchParams.get("auth") === "failed",
    "provider-error callback marks auth=failed",
  );
  assertFresh(
    redirectUrl.searchParams.get("auth_code") === expectedAuthCode,
    `provider-error callback preserves sanitized auth_code=${expectedAuthCode} (got ${formatValue(
      redirectUrl.searchParams.get("auth_code"),
    )})`,
  );
  assertFresh(
    /^[0-9a-f]{16}$/.test(redirectUrl.searchParams.get("auth_ref") ?? ""),
    `provider-error callback includes diagnostic auth_ref (got ${formatValue(
      redirectUrl.searchParams.get("auth_ref"),
    )})`,
  );
  assertHard(
    !redirectUrl.searchParams.has("error_description"),
    "provider-error callback does not reflect error_description",
  );
}

async function fetchUrl(path, init = {}) {
  return fetch(new URL(path, baseUrl), { cache: "no-store", ...init });
}

function assertHard(condition, message) {
  results.push({ level: condition ? "PASS" : "FAIL", message });
}

function assertFresh(condition, message) {
  if (condition) {
    results.push({ level: "PASS", message });
    return;
  }

  results.push({ level: allowKnownStale ? "WARN" : "FAIL", message });
}

function parseArgs(rawArgs) {
  const parsed = {
    allowKnownStale: false,
    baseUrl: null,
    expectedSha: null,
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--allow-known-stale") {
      parsed.allowKnownStale = true;
      continue;
    }

    if (arg === "--expect-sha") {
      const expectedSha = normalizeExpectedSha(rawArgs[index + 1]);
      if (!expectedSha) {
        console.error("--expect-sha requires a non-empty SHA value");
        process.exit(2);
      }
      parsed.expectedSha = expectedSha;
      index += 1;
      continue;
    }

    if (arg.startsWith("--expect-sha=")) {
      const expectedSha = normalizeExpectedSha(arg.slice("--expect-sha=".length));
      if (!expectedSha) {
        console.error("--expect-sha requires a non-empty SHA value");
        process.exit(2);
      }
      parsed.expectedSha = expectedSha;
      continue;
    }

    if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    }

    if (parsed.baseUrl) {
      console.error(`Unexpected extra positional argument: ${arg}`);
      process.exit(2);
    }
    parsed.baseUrl = arg;
  }

  return parsed;
}

function normalizeExpectedSha(value) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function shaMatches(actual, expected) {
  const normalizedActual = normalizeExpectedSha(actual);
  if (!normalizedActual) {
    return false;
  }

  return (
    normalizedActual === expected ||
    normalizedActual.startsWith(expected) ||
    expected.startsWith(normalizedActual)
  );
}

function normalizeBaseUrl(value) {
  try {
    const url = new URL(value);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    console.error(`Invalid base URL: ${value}`);
    process.exit(2);
  }
}

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function stringField(value, key) {
  const field = value[key];
  return typeof field === "string" ? field : null;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatValue(value) {
  return value === null || value === undefined || value === ""
    ? "missing"
    : value;
}

function writeResults() {
  for (const result of results) {
    const label = result.level.padEnd(4);
    console.log(`${label} ${result.message}`);
  }

  if (results.some((result) => result.level === "FAIL")) {
    process.exitCode = 1;
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
