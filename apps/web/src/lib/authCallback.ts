export function sanitizeAuthCallbackValue(value: string, maxLength: number) {
  let sanitized = "";
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    sanitized += code < 32 || code === 127 ? " " : character;
  }

  return sanitized
    .replaceAll(/\s+/gu, " ")
    .trim()
    .slice(0, maxLength);
}

export function createAuthFailureReference(
  randomUuid = () => crypto.randomUUID(),
) {
  return sanitizeAuthCallbackValue(randomUuid().replaceAll("-", ""), 16);
}

export interface AuthFailureLogInput {
  authRef: string;
  code: string;
  errorMessage?: string | null;
  errorName?: string | null;
  errorStack?: string | null;
  hasCode?: boolean;
  hasCodeVerifier?: boolean;
  hasExpectedState?: boolean;
  hasState?: boolean;
  providerError?: string | null;
  providerErrorDescription?: string | null;
  requestPath?: string;
  stage: string;
  stateMatches?: boolean;
}

export function authFailureLogEvent(input: AuthFailureLogInput) {
  return {
    authRef: sanitizeAuthCallbackValue(input.authRef, 32),
    code: sanitizeAuthCallbackValue(input.code, 80) || "unknown",
    errorMessage: sanitizeAuthLogValue(input.errorMessage, 500),
    errorName: sanitizeAuthLogValue(input.errorName, 120),
    errorStack: sanitizeAuthLogValue(input.errorStack, 2000),
    event: "azure_oauth_callback_failed",
    hasCode: input.hasCode,
    hasCodeVerifier: input.hasCodeVerifier,
    hasExpectedState: input.hasExpectedState,
    hasState: input.hasState,
    providerError: sanitizeAuthLogValue(input.providerError, 120),
    providerErrorDescription: sanitizeAuthLogValue(
      input.providerErrorDescription,
      500,
    ),
    requestPath: sanitizeAuthLogValue(input.requestPath, 120),
    stage: sanitizeAuthCallbackValue(input.stage, 80) || "unknown",
    stateMatches: input.stateMatches,
  };
}

export function logAuthFailure(input: AuthFailureLogInput) {
  console.warn(JSON.stringify(authFailureLogEvent(input)));
}

export function authFailureHint(code: string) {
  switch (code) {
    case "access_denied": {
      return "Azure denied the sign-in request. Retry login and confirm consent if prompted; if it repeats, check the app registration permissions.";
    }
    case "invalid_client": {
      return "Azure rejected the configured OAuth client. Verify the client ID, client secret, tenant, redirect URI, and Azure DevOps delegated permissions in the app registration.";
    }
    case "invalid_grant": {
      return "The authorization code could not be exchanged. Retry login; if it repeats, check the callback URL and PKCE/state cookie settings.";
    }
    case "invalid_oauth_state": {
      return "The OAuth state or PKCE verifier was missing or mismatched. Retry login and check that callback cookies are preserved on the app domain.";
    }
    case "profile_or_org_check_failed": {
      return "Azure sign-in succeeded, but the app could not confirm the account profile and configured organization membership.";
    }
    case "token_exchange_failed": {
      return "Azure did not return a usable access token. Check the app registration permissions and consent status.";
    }
    case "provider_error": {
      return "Azure returned an OAuth provider error before the callback could exchange a code. Retry login and check the Azure app registration if it persists.";
    }
    case "callback_failed": {
      return "The callback failed after Azure redirected back to the app. Check server logs for the stable failure code and stack trace.";
    }
    default: {
      return null;
    }
  }
}

function sanitizeAuthLogValue(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return;
  }

  const sanitized = sanitizeAuthCallbackValue(value, maxLength);
  if (!sanitized) {
    return;
  }

  return sanitized
    .replaceAll(
      /\b(client_secret|code_verifier|access_token|refresh_token|id_token|authorization|cookie)\b\s*[:=]\s*[^&\s;,]+/giu,
      "$1=[redacted]",
    )
    .replaceAll(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gu, "Bearer [redacted]");
}
