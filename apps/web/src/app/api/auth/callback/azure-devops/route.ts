import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  AzureDevOpsTokenExchangeError,
  createUserSession,
  exchangeAzureDevOpsCode,
  expiredCookieOptions,
  fetchAzureDevOpsUser,
  oauthCodeVerifierCookie,
  oauthStateCookie,
  secureCookieOptions,
  sessionCookie,
} from "@/lib/auth";
import { MissingAzureDevOpsOAuthConfigError, appBaseUrl } from "@/lib/config";

export async function GET(request: NextRequest) {
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    const response = authFailureRedirect(
      providerError,
      request.nextUrl.searchParams.get("error_description"),
    );
    clearOauthCookies(response);
    return response;
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(oauthStateCookie())?.value;
  const codeVerifier = request.cookies.get(oauthCodeVerifierCookie())?.value;
  if (
    code === null ||
    code === "" ||
    state === null ||
    state === "" ||
    state !== expectedState ||
    codeVerifier === undefined ||
    codeVerifier === ""
  ) {
    const response = authFailureRedirect(
      "invalid_oauth_state",
      "The Azure DevOps login session expired or did not match this browser.",
    );
    clearOauthCookies(response);
    return response;
  }

  let tokens: Awaited<ReturnType<typeof exchangeAzureDevOpsCode>>;
  try {
    tokens = await exchangeAzureDevOpsCode(code, codeVerifier);
  } catch (error) {
    if (error instanceof MissingAzureDevOpsOAuthConfigError) {
      return NextResponse.redirect(
        new URL("/?auth=misconfigured", appBaseUrl()),
      );
    }
    if (error instanceof AzureDevOpsTokenExchangeError) {
      const response = authFailureRedirect(error.code, error.description);
      clearOauthCookies(response);
      return response;
    }

    throw error;
  }
  if (tokens === null) {
    const response = authFailureRedirect(
      "token_exchange_failed",
      "Azure DevOps returned an error while exchanging the authorization code.",
    );
    clearOauthCookies(response);
    return response;
  }

  const azureUser = await fetchAzureDevOpsUser(tokens.accessToken);
  if (azureUser === null) {
    const response = authFailureRedirect(
      "profile_or_org_check_failed",
      "Could not read the Azure DevOps profile or confirm organization membership.",
    );
    clearOauthCookies(response);
    return response;
  }

  const sessionId = await createUserSession(azureUser, tokens);
  const response = NextResponse.redirect(new URL("/dashboard", appBaseUrl()));
  response.cookies.set(sessionCookie(), sessionId, {
    ...secureCookieOptions(30 * 24 * 60 * 60),
  });
  clearOauthCookies(response);
  return response;
}

function authFailureRedirect(code: string, description: string | null) {
  const url = new URL("/", appBaseUrl());
  url.searchParams.set("auth", "failed");
  url.searchParams.set("auth_code", sanitizeAuthCallbackValue(code, 80));
  const safeDescription = sanitizeAuthCallbackValue(description, 600);
  if (safeDescription) {
    url.searchParams.set("auth_description", safeDescription);
  }

  return NextResponse.redirect(url);
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.set(oauthStateCookie(), "", expiredCookieOptions());
  response.cookies.set(oauthCodeVerifierCookie(), "", expiredCookieOptions());
}

function sanitizeAuthCallbackValue(value: string | null, maxLength: number) {
  let sanitized = "";
  for (const character of value ?? "") {
    const code = character.codePointAt(0) ?? 0;
    sanitized += code < 32 || code === 127 ? " " : character;
  }

  return sanitized
    .replaceAll(/\s+/gu, " ")
    .trim()
    .slice(0, maxLength);
}
