import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseExtensionAuthState,
  parseExtensionCallbackUrl,
} from "./extensionAuth";

void test("parseExtensionCallbackUrl accepts this extension's VS Code callback", () => {
  const url = parseExtensionCallbackUrl(
    "vscode://antoni-czaplicki.copilot-tracker/auth",
  );

  assert.equal(url?.protocol, "vscode:");
  assert.equal(url?.hostname, "antoni-czaplicki.copilot-tracker");
  assert.equal(url?.pathname, "/auth");
});

void test("parseExtensionCallbackUrl accepts VS Code Insiders callback", () => {
  const url = parseExtensionCallbackUrl(
    "vscode-insiders://antoni-czaplicki.copilot-tracker/auth",
  );

  assert.equal(url?.protocol, "vscode-insiders:");
});

void test("parseExtensionCallbackUrl rejects unsafe callback URLs", () => {
  assert.equal(parseExtensionCallbackUrl(null), null);
  assert.equal(parseExtensionCallbackUrl("not a url"), null);
  assert.equal(parseExtensionCallbackUrl("https://example.com/auth"), null);
  assert.equal(parseExtensionCallbackUrl("vscode://evil.example/auth"), null);
  assert.equal(
    parseExtensionCallbackUrl(
      "vscode://antoni-czaplicki.copilot-tracker/other",
    ),
    null,
  );
  assert.equal(
    parseExtensionCallbackUrl(
      "vscode://antoni-czaplicki.copilot-tracker/auth?token=unsafe",
    ),
    null,
  );
});

void test("parseExtensionAuthState accepts only compact URL-safe state", () => {
  assert.equal(parseExtensionAuthState("abc-123._~"), "abc-123._~");
  assert.equal(parseExtensionAuthState(null), null);
  assert.equal(parseExtensionAuthState(""), null);
  assert.equal(parseExtensionAuthState("space value"), null);
  assert.equal(parseExtensionAuthState("x".repeat(129)), null);
});
