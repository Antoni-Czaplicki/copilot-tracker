import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { currentUser, sessionCookie } from "@/lib/auth";
import { appBaseUrl } from "@/lib/config";
import {
  parseExtensionAuthState,
  parseExtensionCallbackUrl,
} from "@/lib/extensionAuth";
import { createSession, readSessionAzureDevOpsTokens } from "@/lib/store";

export async function GET(request: NextRequest) {
  const callbackUrl = parseExtensionCallbackUrl(
    request.nextUrl.searchParams.get("callback"),
  );
  if (!callbackUrl) {
    return NextResponse.json({ error: "invalid_callback" }, { status: 400 });
  }

  const user = await currentUser();
  const sourceSessionId = request.cookies.get(sessionCookie())?.value ?? null;
  if (!user || !sourceSessionId) {
    return NextResponse.redirect(extensionSignInRequiredUrl());
  }

  const azureDevOpsTokens = await readSessionAzureDevOpsTokens(sourceSessionId);
  const extensionSession = await createSession(
    user.userId,
    azureDevOpsTokens ?? undefined,
  );
  const state = parseExtensionAuthState(
    request.nextUrl.searchParams.get("state"),
  );
  callbackUrl.searchParams.set("token", extensionSession.id);
  if (state) {
    callbackUrl.searchParams.set("state", state);
  }

  return new NextResponse(null, {
    headers: { location: callbackUrl.toString() },
    status: 307,
  });
}

function extensionSignInRequiredUrl() {
  const url = new URL("/", appBaseUrl());
  url.searchParams.set("auth", "failed");
  url.searchParams.set("auth_code", "extension_signin_required");
  return url;
}
