import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { test } from "node:test";

const scriptPath = new URL("./smoke-production.mjs", import.meta.url);

test("production smoke verifier passes a fresh deployment", async () => {
  await withSmokeServer({ fresh: true }, async (baseUrl) => {
    const result = await runSmoke(baseUrl);

    assert.equal(result.code, 0);
    assert.match(
      result.stdout,
      /PASS \/api\/health exposes a non-unknown version\.sha/,
    );
    assert.match(
      result.stdout,
      /PASS provider-error callback preserves sanitized auth_code=access_denied/,
    );
    assert.match(
      result.stdout,
      /PASS provider-error callback includes diagnostic auth_ref/,
    );
    assert.equal(result.stderr, "");
  });
});

test("production smoke verifier can require the expected deployed SHA", async () => {
  await withSmokeServer({ fresh: true }, async (baseUrl) => {
    const result = await runSmoke(baseUrl, "--expect-sha=abc1234");

    assert.equal(result.code, 0);
    assert.match(
      result.stdout,
      /PASS \/api\/health version\.sha matches expected deployed SHA abc1234/,
    );
    assert.equal(result.stderr, "");
  });
});

test("production smoke verifier accepts a forwarded argument separator", async () => {
  await withSmokeServer({ fresh: true }, async (baseUrl) => {
    const result = await runSmoke(baseUrl, "--", "--expect-sha=abc1234");

    assert.equal(result.code, 0);
    assert.match(
      result.stdout,
      /PASS \/api\/health version\.sha matches expected deployed SHA abc1234/,
    );
    assert.equal(result.stderr, "");
  });
});

test("production smoke verifier accepts short or long matching SHA prefixes", async () => {
  await withSmokeServer({ fresh: true }, async (baseUrl) => {
    const result = await runSmoke(baseUrl, "--expect-sha", "abc");

    assert.equal(result.code, 0);
    assert.match(
      result.stdout,
      /PASS \/api\/health version\.sha matches expected deployed SHA abc/,
    );
    assert.equal(result.stderr, "");
  });
});

test("production smoke verifier fails strict mode on deployed SHA mismatch", async () => {
  await withSmokeServer({ fresh: true }, async (baseUrl) => {
    const result = await runSmoke(baseUrl, "--expect-sha", "deadbeef");

    assert.equal(result.code, 1);
    assert.match(
      result.stdout,
      /FAIL \/api\/health version\.sha matches expected deployed SHA deadbeef \(got abc1234\)/,
    );
    assert.equal(result.stderr, "");
  });
});

test("production smoke verifier fails strict mode on stale deployment evidence", async () => {
  await withSmokeServer({ fresh: false }, async (baseUrl) => {
    const result = await runSmoke(baseUrl);

    assert.equal(result.code, 1);
    assert.match(
      result.stdout,
      /FAIL \/api\/health exposes a non-unknown version\.sha/,
    );
    assert.match(
      result.stdout,
      /FAIL \/api\/health sends Cache-Control: no-store/,
    );
    assert.match(
      result.stdout,
      /FAIL provider-error callback preserves sanitized auth_code=access_denied/,
    );
    assert.match(
      result.stdout,
      /FAIL provider-error callback includes diagnostic auth_ref/,
    );
    assert.equal(result.stderr, "");
  });
});

test("production smoke verifier can warn for known stale deployment evidence", async () => {
  await withSmokeServer({ fresh: false }, async (baseUrl) => {
    const result = await runSmoke(
      baseUrl,
      "--allow-known-stale",
      "--expect-sha",
      "abc1234",
    );

    assert.equal(result.code, 0);
    assert.match(
      result.stdout,
      /WARN \/api\/health exposes a non-unknown version\.sha/,
    );
    assert.match(
      result.stdout,
      /WARN \/api\/health version\.sha matches expected deployed SHA abc1234/,
    );
    assert.match(
      result.stdout,
      /WARN \/api\/health sends Cache-Control: no-store/,
    );
    assert.match(
      result.stdout,
      /WARN provider-error callback preserves sanitized auth_code=access_denied/,
    );
    assert.match(
      result.stdout,
      /WARN provider-error callback includes diagnostic auth_ref/,
    );
    assert.equal(result.stderr, "");
  });
});

async function runSmoke(baseUrl, ...args) {
  const child = spawn(
    process.execPath,
    [scriptPath.pathname, ...args, baseUrl],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const [code, stdout, stderr] = await Promise.all([
    new Promise((resolve) => {
      child.on("close", resolve);
    }),
    readStream(child.stdout),
    readStream(child.stderr),
  ]);

  return { code, stdout, stderr };
}

async function withSmokeServer({ fresh }, callback) {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    if (url.pathname === "/api/health") {
      if (fresh) {
        response.setHeader("cache-control", "no-store");
      }
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          ok: true,
          database: { ok: true },
          version: {
            sha: fresh ? "abc1234" : "unknown",
            builtAt: fresh ? "2026-07-01T06:00:00.000Z" : "unknown",
          },
        }),
      );
      return;
    }

    if (url.pathname === "/api/auth/azure-devops") {
      const redirectUrl = new URL(
        "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
      );
      redirectUrl.searchParams.set("state", "state");
      redirectUrl.searchParams.set("code_challenge", "challenge");
      redirectUrl.searchParams.set("code_challenge_method", "S256");
      redirectUrl.searchParams.set(
        "scope",
        "offline_access 499b84ac-1321-427f-aa17-267ca6975798/vso.profile 499b84ac-1321-427f-aa17-267ca6975798/vso.work",
      );
      response.writeHead(307, { location: redirectUrl.toString() });
      response.end();
      return;
    }

    if (url.pathname === "/api/auth/callback/azure-devops") {
      const redirectUrl = new URL("/", serverOrigin(server));
      redirectUrl.searchParams.set("auth", "failed");
      redirectUrl.searchParams.set(
        "auth_code",
        fresh ? "access_denied" : "provider_error",
      );
      if (fresh) {
        redirectUrl.searchParams.set("auth_ref", "1234567890abcdef");
      }
      response.writeHead(307, { location: redirectUrl.toString() });
      response.end();
      return;
    }

    response.writeHead(404);
    response.end();
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    await callback(serverOrigin(server));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

function serverOrigin(server) {
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return `http://127.0.0.1:${address.port}`;
}

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
