import assert from "node:assert/strict";
import { test } from "node:test";

import { parseBillingDate } from "./githubBillingDate";

void test("parseBillingDate accepts valid YYYY-MM-DD dates", () => {
  assert.equal(parseBillingDate("2026-07-01"), "2026-07-01");
  assert.equal(parseBillingDate("2024-02-29"), "2024-02-29");
});

void test("parseBillingDate treats missing values as default-date requests", () => {
  assert.equal(parseBillingDate(null), undefined);
  assert.equal(parseBillingDate(""), undefined);
});

void test("parseBillingDate rejects malformed or impossible dates", () => {
  assert.equal(parseBillingDate("2026-7-1"), null);
  assert.equal(parseBillingDate("2026-02-29"), null);
  assert.equal(parseBillingDate("2026-01-32"), null);
  assert.equal(parseBillingDate("not-a-date"), null);
});
