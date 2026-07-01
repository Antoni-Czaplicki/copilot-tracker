import assert from "node:assert/strict";
import { test } from "node:test";

import { isCronAuthorized } from "./cronAuth";

void test("isCronAuthorized fails closed when no cron secret is configured", () => {
  assert.equal(isCronAuthorized(null, "Bearer cron-secret"), false);
  assert.equal(isCronAuthorized("", "Bearer cron-secret"), false);
});

void test("isCronAuthorized accepts matching bearer tokens", () => {
  assert.equal(isCronAuthorized("cron-secret", "Bearer cron-secret"), true);
  assert.equal(isCronAuthorized("cron-secret", "bearer   cron-secret"), true);
  assert.equal(isCronAuthorized("cron-secret", "  Bearer cron-secret  "), true);
});

void test("isCronAuthorized rejects missing, malformed, and wrong tokens", () => {
  assert.equal(isCronAuthorized("cron-secret", null), false);
  assert.equal(isCronAuthorized("cron-secret", "Basic cron-secret"), false);
  assert.equal(isCronAuthorized("cron-secret", "Bearer wrong-secret"), false);
  assert.equal(
    isCronAuthorized("cron-secret", "Bearer cron-secret extra"),
    false,
  );
});
