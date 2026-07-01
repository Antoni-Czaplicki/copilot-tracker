import assert from "node:assert/strict";
import { test } from "node:test";

import { authFailureHint, sanitizeAuthCallbackValue } from "./authCallback";

void test("sanitizeAuthCallbackValue removes control characters and collapses whitespace", () => {
  assert.equal(
    sanitizeAuthCallbackValue(" invalid\n\tclient \u007F  with   gaps ", 80),
    "invalid client with gaps",
  );
});

void test("sanitizeAuthCallbackValue truncates long provider codes", () => {
  assert.equal(sanitizeAuthCallbackValue("a".repeat(100), 12), "aaaaaaaaaaaa");
});

void test("authFailureHint explains common Azure OAuth failures safely", () => {
  assert.match(authFailureHint("invalid_client") ?? "", /client ID/);
  assert.match(authFailureHint("invalid_oauth_state") ?? "", /PKCE/);
  assert.match(authFailureHint("profile_or_org_check_failed") ?? "", /organization/);
});

void test("authFailureHint omits details for unknown codes", () => {
  assert.equal(authFailureHint("unexpected_provider_blob"), null);
});
