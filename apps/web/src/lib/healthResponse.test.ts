import assert from "node:assert/strict";
import { test } from "node:test";

import { healthResponseInit } from "./healthResponse";

void test("healthResponseInit returns an uncached 200 response for ready health", () => {
  assert.deepEqual(healthResponseInit(true), {
    headers: {
      "cache-control": "no-store",
    },
    status: 200,
  });
});

void test("healthResponseInit returns an uncached 503 response for unhealthy checks", () => {
  assert.deepEqual(healthResponseInit(false), {
    headers: {
      "cache-control": "no-store",
    },
    status: 503,
  });
});
