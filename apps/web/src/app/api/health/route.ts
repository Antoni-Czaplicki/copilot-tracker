import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { readBuildInfo } from "@/lib/buildInfo";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await checkDatabase();
  const ok = database.ok;

  return NextResponse.json(
    {
      ok,
      database,
      version: readBuildInfo(),
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
