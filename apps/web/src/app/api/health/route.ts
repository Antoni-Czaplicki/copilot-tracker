import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  const ok = database.ok;

  return NextResponse.json(
    {
      ok,
      database,
      version: {
        sha: process.env.COPILOT_TRACKER_BUILD_SHA ?? "unknown",
        builtAt: process.env.COPILOT_TRACKER_BUILD_TIME ?? "unknown",
      },
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}

async function checkDatabase() {
  try {
    await db.execute(sql`select 1`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

