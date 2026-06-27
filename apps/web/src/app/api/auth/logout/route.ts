import { NextRequest, NextResponse } from "next/server";

import { sessionCookie } from "@/lib/auth";
import { appBaseUrl } from "@/lib/config";
import { deleteSession } from "@/lib/store";

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(sessionCookie())?.value;
  if (sessionId) {
    await deleteSession(sessionId);
  }

  const response = NextResponse.redirect(new URL("/", appBaseUrl()));
  response.cookies.delete(sessionCookie());
  return response;
}
