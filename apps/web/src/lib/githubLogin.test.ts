import assert from "node:assert/strict";
import { test } from "node:test";

import {
  githubLoginMutationErrorMessage,
  normalizeGithubLogin,
} from "./githubLogin";

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

void test("githubLoginMutationErrorMessage uses safe server error text", async () => {
  assert.equal(
    await githubLoginMutationErrorMessage(
      Response.json({ error: "Invalid GitHub username." }, { status: 400 }),
    ),
    "Invalid GitHub username.",
  );
});

void test("githubLoginMutationErrorMessage falls back for empty or non-JSON responses", async () => {
  assert.equal(
    await githubLoginMutationErrorMessage(
      Response.json({ error: "" }, { status: 500 }),
    ),
    "Failed to save GitHub username.",
  );
  assert.equal(
    await githubLoginMutationErrorMessage(
      new Response("not json", { status: 500 }),
    ),
    "Failed to save GitHub username.",
  );
});
