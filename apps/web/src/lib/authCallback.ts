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

export function authFailureHint(code: string) {
  switch (code) {
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
