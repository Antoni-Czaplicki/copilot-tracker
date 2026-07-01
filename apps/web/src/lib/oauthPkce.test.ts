import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import { createOauthPkceChallenge } from "./oauthPkce";

void test("createOauthPkceChallenge returns a URL-safe S256 verifier/challenge pair", async () => {
  const pkce = await createOauthPkceChallenge();
  const expectedChallenge = createHash("sha256")
    .update(pkce.codeVerifier)
    .digest("base64url");

  assert.match(pkce.codeVerifier, /^[A-Za-z0-9_-]+$/);
  assert.match(pkce.codeChallenge, /^[A-Za-z0-9_-]+$/);
  assert.equal(pkce.codeVerifier.length, 43);
  assert.equal(pkce.codeChallenge.length, 43);
  assert.equal(pkce.codeChallenge, expectedChallenge);
});

void test("createOauthPkceChallenge generates a fresh verifier for each call", async () => {
  const first = await createOauthPkceChallenge();
  const second = await createOauthPkceChallenge();

  assert.notEqual(first.codeVerifier, second.codeVerifier);
  assert.notEqual(first.codeChallenge, second.codeChallenge);
});
