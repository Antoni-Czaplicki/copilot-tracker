import assert from "node:assert/strict";
import { test } from "node:test";

import { readResponseError, responseErrorMessage } from "./responseErrors";

void test("readResponseError returns trimmed string errors", async () => {
  assert.equal(
    await readResponseError(
      Response.json({ error: "  invalid task assignment  " }, { status: 400 }),
    ),
    "invalid task assignment",
  );
});

void test("readResponseError ignores empty, non-string, and non-object errors", async () => {
  assert.equal(
    await readResponseError(Response.json({ error: "   " }, { status: 400 })),
    null,
  );
  assert.equal(
    await readResponseError(Response.json({ error: 123 }, { status: 400 })),
    null,
  );
  assert.equal(
    await readResponseError(Response.json(["error"], { status: 400 })),
    null,
  );
});

void test("responseErrorMessage falls back for malformed or empty responses", async () => {
  assert.equal(
    await responseErrorMessage(new Response("oops", { status: 500 }), "Failed"),
    "Failed",
  );
  assert.equal(
    await responseErrorMessage(new Response(null, { status: 204 }), "Failed"),
    "Failed",
  );
});
