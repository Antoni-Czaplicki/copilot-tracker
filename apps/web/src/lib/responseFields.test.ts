import assert from "node:assert/strict";
import { test } from "node:test";

import { readNumericResponseField } from "./responseFields";

void test("readNumericResponseField reads finite numeric fields", async () => {
  const response = Response.json({ synced: 12, updated: "4" });

  assert.equal(await readNumericResponseField(response, "synced"), 12);
});

void test("readNumericResponseField falls back for missing and non-finite fields", async () => {
  assert.equal(
    await readNumericResponseField(Response.json({ synced: "12" }), "synced"),
    null,
  );
  assert.equal(
    await readNumericResponseField(
      Response.json({ synced: Number.POSITIVE_INFINITY }),
      "synced",
    ),
    null,
  );
  assert.equal(
    await readNumericResponseField(Response.json({}), "synced"),
    null,
  );
});

void test("readNumericResponseField falls back for malformed, empty, and non-object responses", async () => {
  assert.equal(
    await readNumericResponseField(
      new Response("{", {
        headers: { "content-type": "application/json" },
      }),
      "synced",
    ),
    null,
  );
  assert.equal(await readNumericResponseField(new Response(null), "synced"), null);
  assert.equal(
    await readNumericResponseField(Response.json([12]), "synced"),
    null,
  );
  assert.equal(
    await readNumericResponseField(Response.json(null), "synced"),
    null,
  );
});
