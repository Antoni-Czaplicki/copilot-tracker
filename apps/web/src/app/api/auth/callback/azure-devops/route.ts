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
import { sanitizeAuthCallbackValue } from "@/lib/authCallback";
import { MissingAzureDevOpsOAuthConfigError, appBaseUrl } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    const providerError = request.nextUrl.searchParams.get("error");
    if (providerError) {
      return failureResponse(providerFailureCode(providerError));
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
      return failureResponse("invalid_oauth_state");
    }

    let tokens: Awaited<ReturnType<typeof exchangeAzureDevOpsCode>>;
    try {
      tokens = await exchangeAzureDevOpsCode(code, codeVerifier);
    } catch (error) {
      if (error instanceof AzureDevOpsTokenExchangeError) {
        return failureResponse(error.code);
      }

      throw error;
    }
    if (tokens === null) {
      return failureResponse("token_exchange_failed");
    }

    const azureUser = await fetchAzureDevOpsUser(tokens.accessToken);
    if (azureUser === null) {
      return failureResponse("profile_or_org_check_failed");
    }

    const sessionId = await createUserSession(azureUser, tokens);
    const response = NextResponse.redirect(new URL("/dashboard", appBaseUrl()));
    response.cookies.set(sessionCookie(), sessionId, {
      ...secureCookieOptions(30 * 24 * 60 * 60),
    });
    clearOauthCookies(response);
    return response;
  } catch (error) {
    if (error instanceof MissingAzureDevOpsOAuthConfigError) {
      const response = NextResponse.redirect(
        new URL("/?auth=misconfigured", appBaseUrl()),
      );
      clearOauthCookies(response);
      return response;
    }

    return failureResponse("callback_failed");
  }
}

function failureResponse(code: string) {
  const response = authFailureRedirect(code);
  clearOauthCookies(response);
  return response;
}

function authFailureRedirect(code: string) {
  const url = new URL("/", appBaseUrl());
  url.searchParams.set("auth", "failed");
  url.searchParams.set("auth_code", sanitizeAuthCallbackValue(code, 80));

  return NextResponse.redirect(url);
}

function providerFailureCode(providerError: string) {
  return sanitizeAuthCallbackValue(providerError, 80) || "provider_error";
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.set(oauthStateCookie(), "", expiredCookieOptions());
  response.cookies.set(oauthCodeVerifierCookie(), "", expiredCookieOptions());
}
