import { NextResponse } from "next/server";

import {
  createOauthPkceChallenge,
  oauthCodeVerifierCookie,
  oauthStateCookie,
  secureCookieOptions,
} from "@/lib/auth";
import {
  MissingAzureDevOpsOAuthConfigError,
  appBaseUrl,
  azureDevOpsScope,
  requireAzureDevOpsOAuthConfig,
} from "@/lib/config";

export async function GET() {
  let oauthConfig: ReturnType<typeof requireAzureDevOpsOAuthConfig>;
  try {
    oauthConfig = requireAzureDevOpsOAuthConfig();
  } catch (error) {
    if (error instanceof MissingAzureDevOpsOAuthConfigError) {
      return NextResponse.redirect(
        new URL("/?auth=misconfigured", appBaseUrl()),
      );
    }

    throw error;
  }

  const state = crypto.randomUUID();
  const pkce = await createOauthPkceChallenge();
  const url = new URL(oauthConfig.authorizeUrl);
  url.searchParams.set("client_id", oauthConfig.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", oauthConfig.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", azureDevOpsScope());
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", pkce.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(url);
  response.cookies.set(oauthStateCookie(), state, {
    ...secureCookieOptions(10 * 60),
  });
  response.cookies.set(oauthCodeVerifierCookie(), pkce.codeVerifier, {
    ...secureCookieOptions(10 * 60),
  });
  return response;
}
