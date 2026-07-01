import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { exportCsv, parseExportType } from "@/lib/adminExport";
import { currentUser, isAdmin } from "@/lib/auth";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const type = parseExportType(
    request.nextUrl.searchParams.get("type") ?? "requests",
  );
  if (type === null) {
    return NextResponse.json(
      { error: "unsupported export type" },
      { status: 400 },
    );
  }

  const database = await readDatabase();
  const csv = exportCsv(type, database);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="copilot-${type}.csv"`,
    },
  });
}
