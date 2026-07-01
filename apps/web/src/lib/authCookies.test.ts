import assert from "node:assert/strict";
import { test } from "node:test";

process.env.DATABASE_URL ??=
  "postgres://user:pass@localhost:5432/copilot_tracker";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3737";

const {
  expiredCookieOptions,
  secureCookieOptions,
  shouldUseSecureCookiesForAppUrl,
} = await import("./authCookies");

void test("shouldUseSecureCookiesForAppUrl follows the configured app URL scheme", () => {
  assert.equal(
    shouldUseSecureCookiesForAppUrl("https://copilot-tracker.example", "development"),
    true,
  );
  assert.equal(
    shouldUseSecureCookiesForAppUrl("http://localhost:3737", "production"),
    false,
  );
});

void test("shouldUseSecureCookiesForAppUrl falls back to NODE_ENV for malformed URLs", () => {
  assert.equal(shouldUseSecureCookiesForAppUrl("not a url", "production"), true);
  assert.equal(
    shouldUseSecureCookiesForAppUrl("not a url", "development"),
    false,
  );
});

void test("secureCookieOptions returns httpOnly lax root cookies with the requested age", () => {
  const expectedSecure = shouldUseSecureCookiesForAppUrl(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3737",
    process.env.NODE_ENV,
  );

  assert.deepEqual(secureCookieOptions(600), {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
    secure: expectedSecure,
  });
});

void test("expiredCookieOptions returns removal-safe root cookie attributes", () => {
  const expectedSecure = shouldUseSecureCookiesForAppUrl(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3737",
    process.env.NODE_ENV,
  );

  assert.deepEqual(expiredCookieOptions(), {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: expectedSecure,
  });
});
