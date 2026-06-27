import { NextResponse } from "next/server";

import { oauthStateCookie } from "@/lib/auth";
import {
  MissingGithubOAuthConfigError,
  appBaseUrl,
  requireGithubOAuthConfig,
} from "@/lib/config";

export function GET() {
  let clientId: string;
  try {
    ({ clientId } = requireGithubOAuthConfig());
  } catch (error) {
    if (error instanceof MissingGithubOAuthConfigError) {
      return NextResponse.redirect(
        new URL("/?auth=misconfigured", appBaseUrl()),
      );
    }

    throw error;
  }

  const state = crypto.randomUUID();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set(
    "redirect_uri",
    `${appBaseUrl()}/api/auth/callback/github`,
  );
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url);
  response.cookies.set(oauthStateCookie(), state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
