import assert from "node:assert/strict";
import { test } from "node:test";

import { githubCopilotBillingRowsFromResponse } from "./githubBillingRows";

void test("githubCopilotBillingRowsFromResponse maps valid usage items", () => {
  const { rows, usageDateValue } = githubCopilotBillingRowsFromResponse({
    body: {
      timePeriod: { year: 2026, month: 7, day: 1 },
      usageItems: [
        {
          product: "Copilot",
          model: "gpt-5-nano",
          sku: "premium_request",
          netQuantity: 42,
          grossAmount: "0.42",
          discountAmount: "0.10",
          netAmount: "0.32",
          unitType: "request",
        },
      ],
    },
    fallbackDate: "2026-06-30",
    fetchedAt: "2026-07-01T00:00:00.000Z",
    scopeType: "organization",
    scope: "example-org",
  });

  assert.equal(usageDateValue, "2026-07-01");
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0], {
    id: "organization:example-org:2026-07-01:gpt-5-nano:premium_request:request:0",
    scopeType: "organization",
    scope: "example-org",
    date: "2026-07-01",
    product: "Copilot",
    sku: "premium_request",
    quantity: "42",
    unitType: "request",
    grossAmount: "0.42",
    discountAmount: "0.10",
    netAmount: "0.32",
    raw: {
      product: "Copilot",
      model: "gpt-5-nano",
      sku: "premium_request",
      netQuantity: 42,
      grossAmount: "0.42",
      discountAmount: "0.10",
      netAmount: "0.32",
      unitType: "request",
    },
    fetchedAt: "2026-07-01T00:00:00.000Z",
  });
});

void test("githubCopilotBillingRowsFromResponse tolerates malformed response shape", () => {
  const { rows, usageDateValue } = githubCopilotBillingRowsFromResponse({
    body: {
      timePeriod: { year: "2026", month: 13, day: 1 },
      usageItems: [
        "not-a-row",
        {
          model: null,
          sku: null,
          unitType: null,
          grossQuantity: 7,
        },
      ],
    },
    fallbackDate: "2026-06-30",
    fetchedAt: "2026-07-01T00:00:00.000Z",
    scopeType: "user",
    scope: "example-user",
  });

  assert.equal(usageDateValue, "2026-06-30");
  assert.equal(rows.length, 1);
  assert.equal(
    rows[0]?.id,
    "user:example-user:2026-06-30:unknown-model:unknown-sku:unknown-unit:0",
  );
  assert.equal(rows[0]?.quantity, "7");

  assert.deepEqual(
    githubCopilotBillingRowsFromResponse({
      body: { usageItems: "not-an-array" },
      fallbackDate: "2026-06-30",
      fetchedAt: "2026-07-01T00:00:00.000Z",
      scopeType: "enterprise",
      scope: "example-enterprise",
    }).rows,
    [],
  );
});

void test("githubCopilotBillingRowsFromResponse falls back for impossible dates", () => {
  const { usageDateValue } = githubCopilotBillingRowsFromResponse({
    body: {
      timePeriod: { year: 2026, month: 2, day: 31 },
      usageItems: [],
    },
    fallbackDate: "2026-02-28",
    fetchedAt: "2026-03-01T00:00:00.000Z",
    scopeType: "organization",
    scope: "example-org",
  });

  assert.equal(usageDateValue, "2026-02-28");
});
