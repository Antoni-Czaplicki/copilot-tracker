import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createUserSession,
  exchangeAzureDevOpsCode,
  fetchAzureDevOpsUser,
  oauthStateCookie,
  sessionCookie,
} from "@/lib/auth";
import { MissingAzureDevOpsOAuthConfigError, appBaseUrl } from "@/lib/config";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(oauthStateCookie())?.value;
  if (
    code === null ||
    code === "" ||
    state === null ||
    state === "" ||
    state !== expectedState
  ) {
    return NextResponse.redirect(new URL("/?auth=failed", appBaseUrl()));
  }

  let accessToken: string | null;
  try {
    accessToken = await exchangeAzureDevOpsCode(code);
  } catch (error) {
    if (error instanceof MissingAzureDevOpsOAuthConfigError) {
      return NextResponse.redirect(
        new URL("/?auth=misconfigured", appBaseUrl()),
      );
    }

    throw error;
  }
  if (accessToken === null) {
    return NextResponse.redirect(new URL("/?auth=failed", appBaseUrl()));
  }

  const azureUser = await fetchAzureDevOpsUser(accessToken);
  if (azureUser === null) {
    return NextResponse.redirect(new URL("/?auth=failed", appBaseUrl()));
  }

  const sessionId = await createUserSession(azureUser);
  const response = NextResponse.redirect(new URL("/dashboard", appBaseUrl()));
  response.cookies.set(sessionCookie(), sessionId, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
  });
  response.cookies.delete(oauthStateCookie());
  return response;
}
