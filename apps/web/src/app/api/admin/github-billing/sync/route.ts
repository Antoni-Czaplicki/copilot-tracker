import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { currentUser, isAdmin } from "@/lib/auth";
import { cronSecret } from "@/lib/config";
import { syncGithubCopilotBillingUsage } from "@/lib/githubBilling";
import { parseBillingDate } from "@/lib/githubBillingDate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const configuredSecret = cronSecret();
  const authorization = request.headers.get("authorization");
  const cronAuthorized =
    configuredSecret && authorization === `Bearer ${configuredSecret}`;
  if (!cronAuthorized) {
    const user = await currentUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const date = parseBillingDate(request.nextUrl.searchParams.get("date"));
    if (date === null) {
      return NextResponse.json(
        { error: "date must be a valid YYYY-MM-DD value" },
        { status: 400 },
      );
    }

    return NextResponse.json(await syncGithubCopilotBillingUsage(date));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "sync failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
