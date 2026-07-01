import assert from "node:assert/strict";
import { test } from "node:test";

import {
  authFailureHint,
  authFailureLogEvent,
  createAuthFailureReference,
  sanitizeAuthCallbackValue,
} from "./authCallback";

void test("sanitizeAuthCallbackValue removes control characters and collapses whitespace", () => {
  assert.equal(
    sanitizeAuthCallbackValue(" invalid\n\tclient \u007F  with   gaps ", 80),
    "invalid client with gaps",
  );
});

void test("sanitizeAuthCallbackValue truncates long provider codes", () => {
  assert.equal(sanitizeAuthCallbackValue("a".repeat(100), 12), "aaaaaaaaaaaa");
});

void test("createAuthFailureReference creates short URL-safe references", () => {
  assert.equal(
    createAuthFailureReference(() => "12345678-90ab-cdef-1234-567890abcdef"),
    "1234567890abcdef",
  );
});

void test("authFailureLogEvent redacts sensitive details while preserving diagnostics", () => {
  assert.deepEqual(
    authFailureLogEvent({
      authRef: "ref-123",
      code: "invalid_client",
      errorMessage:
        "token failed client_secret=super-secret access_token=tok Bearer abc.def",
      providerError: "invalid_client",
      providerErrorDescription:
        "AADSTS7000215: Invalid client secret is provided. client_secret=real",
      requestPath: "/api/auth/callback/azure-devops",
      stage: "provider_error",
    }),
    {
      authRef: "ref-123",
      code: "invalid_client",
      errorMessage:
        "token failed client_secret=[redacted] access_token=[redacted] Bearer [redacted]",
      errorName: undefined,
      errorStack: undefined,
      event: "azure_oauth_callback_failed",
      hasCode: undefined,
      hasCodeVerifier: undefined,
      hasExpectedState: undefined,
      hasState: undefined,
      providerError: "invalid_client",
      providerErrorDescription:
        "AADSTS7000215: Invalid client secret is provided. client_secret=[redacted]",
      requestPath: "/api/auth/callback/azure-devops",
      stage: "provider_error",
      stateMatches: undefined,
    },
  );
});

void test("authFailureHint explains common Azure OAuth failures safely", () => {
  assert.match(authFailureHint("access_denied") ?? "", /consent/);
  assert.match(authFailureHint("invalid_client") ?? "", /client ID/);
  assert.match(authFailureHint("invalid_oauth_state") ?? "", /PKCE/);
  assert.match(authFailureHint("profile_or_org_check_failed") ?? "", /organization/);
});

void test("authFailureHint covers token exchange, provider, and callback failures", () => {
  assert.match(authFailureHint("invalid_grant") ?? "", /authorization code/);
  assert.match(authFailureHint("token_exchange_failed") ?? "", /access token/);
  assert.match(authFailureHint("provider_error") ?? "", /provider error/);
  assert.match(authFailureHint("callback_failed") ?? "", /server logs/);
});

void test("authFailureHint omits details for unknown codes", () => {
  assert.equal(authFailureHint("unexpected_provider_blob"), null);
});
