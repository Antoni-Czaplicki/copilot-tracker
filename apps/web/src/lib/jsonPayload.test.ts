import assert from "node:assert/strict";
import { test } from "node:test";

import { readJsonObjectPayload, readJsonPayload } from "./jsonPayload";

void test("readJsonPayload returns any parsed JSON value", async () => {
  assert.deepEqual(await readJsonPayload(jsonRequest([1, "two"])), [1, "two"]);
  assert.equal(await readJsonPayload(jsonRequest("github-user")), "github-user");
});

void test("readJsonObjectPayload returns parsed JSON objects", async () => {
  assert.deepEqual(await readJsonObjectPayload(jsonRequest({ ok: true })), {
    ok: true,
  });
});

void test("readJsonObjectPayload rejects malformed JSON", async () => {
  assert.equal(
    await readJsonPayload({
      json: async () => {
        await Promise.resolve();
        throw new SyntaxError("invalid JSON");
      },
    }),
    null,
  );
});

void test("readJsonObjectPayload rejects arrays, strings, and null", async () => {
  assert.equal(await readJsonObjectPayload(jsonRequest([])), null);
  assert.equal(await readJsonObjectPayload(jsonRequest("github-user")), null);
  assert.equal(await readJsonObjectPayload(jsonRequest(null)), null);
});

function jsonRequest(value: unknown) {
  return {
    json: async () => {
      await Promise.resolve();
      return value;
    },
  };
}
