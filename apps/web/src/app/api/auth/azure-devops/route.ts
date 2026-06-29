import { NextResponse } from "next/server";

import { oauthStateCookie } from "@/lib/auth";
import {
  MissingAzureDevOpsOAuthConfigError,
  appBaseUrl,
  azureDevOpsScope,
  requireAzureDevOpsOAuthConfig,
} from "@/lib/config";

export function GET() {
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
  const url = new URL(oauthConfig.authorizeUrl);
  url.searchParams.set("client_id", oauthConfig.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", oauthConfig.redirectUri);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", azureDevOpsScope());
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
