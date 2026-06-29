import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authenticateIngestRequest } from "@/lib/auth";
import { trackerEventSchema } from "@/lib/payloadSchemas";
import { insertTrackerEvent } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await authenticateIngestRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = trackerEventSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json(
      { error: "invalid event payload" },
      { status: 400 },
    );
  }

  await insertTrackerEvent(payload.data, user);

  return NextResponse.json({ ok: true }, { status: 202 });
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    const payload: unknown = await request.json();
    return payload;
  } catch {
    return null;
  }
}
