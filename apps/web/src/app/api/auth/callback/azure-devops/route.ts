import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  AzureDevOpsTokenExchangeError,
  createUserSession,
  exchangeAzureDevOpsCode,
  expiredCookieOptions,
  fetchAzureDevOpsUserWithDiagnostics,
  oauthCodeVerifierCookie,
  oauthStateCookie,
  secureCookieOptions,
  sessionCookie,
} from "@/lib/auth";
import {
  createAuthFailureReference,
  logAuthFailure,
  sanitizeAuthCallbackValue,
} from "@/lib/authCallback";
import { MissingAzureDevOpsOAuthConfigError, appBaseUrl } from "@/lib/config";

export async function GET(request: NextRequest) {
  try {
    const providerError = request.nextUrl.searchParams.get("error");
    if (providerError) {
      const code = providerFailureCode(providerError);
      return failureResponse(request, code, {
        providerError,
        providerErrorDescription:
          request.nextUrl.searchParams.get("error_description"),
        stage: "provider_error",
      });
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
      return failureResponse(request, "invalid_oauth_state", {
        hasCode: code !== null && code !== "",
        hasCodeVerifier: codeVerifier !== undefined && codeVerifier !== "",
        hasExpectedState: expectedState !== undefined && expectedState !== "",
        hasState: state !== null && state !== "",
        stage: "oauth_state",
        stateMatches:
          state !== null &&
          state !== "" &&
          expectedState !== undefined &&
          expectedState !== "" &&
          state === expectedState,
      });
    }

    let tokens: Awaited<ReturnType<typeof exchangeAzureDevOpsCode>>;
    try {
      tokens = await exchangeAzureDevOpsCode(code, codeVerifier);
    } catch (error) {
      if (error instanceof AzureDevOpsTokenExchangeError) {
        return failureResponse(request, error.code, {
          errorMessage: error.description,
          errorName: error.name,
          stage: "token_exchange",
        });
      }

      throw error;
    }
    if (tokens === null) {
      return failureResponse(request, "token_exchange_failed", {
        stage: "token_exchange",
      });
    }

    const azureUserResult = await fetchAzureDevOpsUserWithDiagnostics(
      tokens.accessToken,
    );
    if (azureUserResult.user === null) {
      return failureResponse(request, "profile_or_org_check_failed", {
        ...azureUserResult.diagnostics,
        stage: "profile_or_org_check",
      });
    }

    const sessionId = await createUserSession(azureUserResult.user, tokens);
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

    return failureResponse(request, "callback_failed", {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
      errorStack: error instanceof Error ? error.stack : null,
      stage: "callback_exception",
    });
  }
}

function failureResponse(
  request: NextRequest,
  code: string,
  details: Omit<
    Parameters<typeof logAuthFailure>[0],
    "authRef" | "code" | "requestPath"
  >,
) {
  const authRef = createAuthFailureReference();
  logAuthFailure({
    ...details,
    authRef,
    code,
    requestPath: request.nextUrl.pathname,
  });
  const response = authFailureRedirect(code, authRef);
  clearOauthCookies(response);
  return response;
}

function authFailureRedirect(code: string, authRef: string) {
  const url = new URL("/", appBaseUrl());
  url.searchParams.set("auth", "failed");
  url.searchParams.set("auth_code", sanitizeAuthCallbackValue(code, 80));
  url.searchParams.set("auth_ref", sanitizeAuthCallbackValue(authRef, 32));

  return NextResponse.redirect(url);
}

function providerFailureCode(providerError: string) {
  return sanitizeAuthCallbackValue(providerError, 80) || "provider_error";
}

function clearOauthCookies(response: NextResponse) {
  response.cookies.set(oauthStateCookie(), "", expiredCookieOptions());
  response.cookies.set(oauthCodeVerifierCookie(), "", expiredCookieOptions());
}
