import assert from "node:assert/strict";
import { test } from "node:test";

import { localDevUserIdentity, parseBearerToken } from "./authIdentity";

void test("localDevUserIdentity is an admin-only local development identity", () => {
  assert.deepEqual(localDevUserIdentity(), {
    userId: "local-dev",
    login: "local-dev",
    name: "Local Developer",
    avatarUrl: null,
    email: null,
    githubLogin: null,
    role: "admin",
  });
});

void test("parseBearerToken accepts canonical bearer auth headers", () => {
  assert.equal(parseBearerToken("Bearer token-123"), "token-123");
  assert.equal(parseBearerToken("bearer token-123"), "token-123");
  assert.equal(parseBearerToken("  Bearer   token-123  "), "token-123");
});

void test("parseBearerToken rejects missing, empty, and malformed auth headers", () => {
  assert.equal(parseBearerToken(null), null);
  assert.equal(parseBearerToken(""), null);
  assert.equal(parseBearerToken("Bearer"), null);
  assert.equal(parseBearerToken("Bearer   "), null);
  assert.equal(parseBearerToken("Basic token-123"), null);
  assert.equal(parseBearerToken("Bearer token-123 extra"), null);
});
