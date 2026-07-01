import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { currentUser, isAdmin } from "@/lib/auth";
import { canRunBillingSync } from "@/lib/billingSyncAuth";
import { cronSecret } from "@/lib/config";
import { syncGithubCopilotBillingUsage } from "@/lib/githubBilling";
import { parseBillingDate } from "@/lib/githubBillingDate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return syncBillingUsage(request, { allowAdmin: false });
}

export async function POST(request: NextRequest) {
  return syncBillingUsage(request, { allowAdmin: true });
}

async function syncBillingUsage(
  request: NextRequest,
  { allowAdmin }: { allowAdmin: boolean },
) {
  const configuredSecret = cronSecret();
  let isAdminUser = false;
  if (allowAdmin) {
    const user = await currentUser();
    isAdminUser = isAdmin(user);
  }

  if (
    !canRunBillingSync({
      allowAdmin,
      authorizationHeader: request.headers.get("authorization"),
      configuredSecret,
      isAdminUser,
    })
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
