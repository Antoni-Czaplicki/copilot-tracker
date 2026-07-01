import assert from "node:assert/strict";
import { test } from "node:test";

import { healthCacheHeaders, healthResponseInit } from "./healthResponse";

void test("healthCacheHeaders disables browser and intermediary caches", () => {
  assert.deepEqual(healthCacheHeaders, {
    "cache-control": "no-store, no-cache, max-age=0, must-revalidate",
    "cdn-cache-control": "no-store",
    expires: "0",
    pragma: "no-cache",
    "surrogate-control": "no-store",
  });
});

void test("healthResponseInit returns an uncached 200 response for ready health", () => {
  assert.deepEqual(healthResponseInit(true), {
    headers: healthCacheHeaders,
    status: 200,
  });
});

void test("healthResponseInit returns an uncached 503 response for unhealthy checks", () => {
  assert.deepEqual(healthResponseInit(false), {
    headers: healthCacheHeaders,
    status: 503,
  });
});
