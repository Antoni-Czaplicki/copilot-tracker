import assert from "node:assert/strict";
import { test } from "node:test";

import {
  decryptSessionTokenValue,
  encryptSessionTokenValue,
} from "./sessionTokenCrypto";

const encryptionMaterial = "test-encryption-material";

void test("session token crypto encrypts and decrypts token values", () => {
  const encrypted = encryptSessionTokenValue("access-token", encryptionMaterial);

  assert.equal(typeof encrypted, "string");
  assert.notEqual(encrypted, "access-token");
  assert.match(encrypted ?? "", /^v1:\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.equal(
    decryptSessionTokenValue(encrypted, encryptionMaterial),
    "access-token",
  );
});

void test("session token crypto skips storage and reading when no key is configured", () => {
  const encrypted = encryptSessionTokenValue("access-token", encryptionMaterial);

  assert.equal(encryptSessionTokenValue("access-token", null), null);
  assert.equal(decryptSessionTokenValue(encrypted, null), null);
  assert.equal(decryptSessionTokenValue("legacy-access-token", null), null);
});

void test("session token crypto keeps legacy plaintext readable only with a key", () => {
  assert.equal(
    decryptSessionTokenValue("legacy-access-token", encryptionMaterial),
    "legacy-access-token",
  );
});

void test("session token crypto rejects malformed encrypted envelopes", () => {
  assert.equal(decryptSessionTokenValue("v1:", encryptionMaterial), null);
  assert.equal(decryptSessionTokenValue("v1:.iv.tag", encryptionMaterial), null);
  assert.equal(
    decryptSessionTokenValue("v1:.iv.tag.cipher.extra", encryptionMaterial),
    null,
  );
  assert.equal(
    decryptSessionTokenValue("v1:.not+base64.tag.cipher", encryptionMaterial),
    null,
  );
});

void test("session token crypto rejects tampered ciphertext", () => {
  const encrypted = encryptSessionTokenValue("access-token", encryptionMaterial);
  assert.ok(encrypted !== null);

  const tampered = `${encrypted.slice(0, -1)}${
    encrypted.endsWith("A") ? "B" : "A"
  }`;
  assert.equal(decryptSessionTokenValue(tampered, encryptionMaterial), null);
});
