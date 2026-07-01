import assert from "node:assert/strict";
import { test } from "node:test";

import { canRunBillingSync } from "./billingSyncAuth";

void test("canRunBillingSync allows cron bearer regardless of admin fallback", () => {
  assert.equal(
    canRunBillingSync({
      allowAdmin: false,
      authorizationHeader: "Bearer cron-secret",
      configuredSecret: "cron-secret",
      isAdminUser: false,
    }),
    true,
  );
});

void test("canRunBillingSync allows admin fallback only when explicitly enabled", () => {
  assert.equal(
    canRunBillingSync({
      allowAdmin: true,
      authorizationHeader: null,
      configuredSecret: "cron-secret",
      isAdminUser: true,
    }),
    true,
  );
  assert.equal(
    canRunBillingSync({
      allowAdmin: false,
      authorizationHeader: null,
      configuredSecret: "cron-secret",
      isAdminUser: true,
    }),
    false,
  );
});

void test("canRunBillingSync rejects unauthenticated requests", () => {
  assert.equal(
    canRunBillingSync({
      allowAdmin: true,
      authorizationHeader: null,
      configuredSecret: "cron-secret",
      isAdminUser: false,
    }),
    false,
  );
});
