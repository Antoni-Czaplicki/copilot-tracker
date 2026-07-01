import assert from "node:assert/strict";
import { test } from "node:test";

import { sanitizeAuthCallbackValue } from "./authCallback";

void test("sanitizeAuthCallbackValue removes control characters and collapses whitespace", () => {
  assert.equal(
    sanitizeAuthCallbackValue(" invalid\n\tclient \u007F  with   gaps ", 80),
    "invalid client with gaps",
  );
});

void test("sanitizeAuthCallbackValue truncates long provider codes", () => {
  assert.equal(sanitizeAuthCallbackValue("a".repeat(100), 12), "aaaaaaaaaaaa");
});
