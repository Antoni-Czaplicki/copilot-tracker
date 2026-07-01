import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeGithubLogin } from "./githubLogin";

void test("normalizeGithubLogin trims whitespace and leading at-sign", () => {
  assert.equal(normalizeGithubLogin("  @octocat  "), "octocat");
});

void test("normalizeGithubLogin returns null for missing or blank values", () => {
  assert.equal(normalizeGithubLogin(null), null);
  assert.equal(normalizeGithubLogin("   "), null);
});

void test("normalizeGithubLogin rejects invalid GitHub usernames", () => {
  for (const login of [
    "-octocat",
    "octocat-",
    "octo_cat",
    "a".repeat(40),
  ]) {
    assert.throws(() => normalizeGithubLogin(login), /Invalid GitHub username/);
  }
});
