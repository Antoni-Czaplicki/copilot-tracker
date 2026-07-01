import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { currentUser, isAdmin } from "@/lib/auth";
import { cronSecret } from "@/lib/config";
import { syncGithubCopilotBillingUsage } from "@/lib/githubBilling";

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

function parseBillingDate(value: string | null) {
  if (value === null || value === "") {
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return value;
}
