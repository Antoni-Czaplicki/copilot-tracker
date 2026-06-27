import { TrackerEvent } from "@copilot-tracker/shared";
import { NextRequest, NextResponse } from "next/server";

import { authenticateIngestRequest } from "@/lib/auth";
import { insertTrackerEvent } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await authenticateIngestRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const event = (await request.json()) as TrackerEvent;
  if (!event.eventId || !event.eventType || !event.workspaceId) {
    return NextResponse.json(
      { error: "invalid event payload" },
      { status: 400 },
    );
  }

  await insertTrackerEvent(event, user);

  return NextResponse.json({ ok: true }, { status: 202 });
}
