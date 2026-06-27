import { CopilotChatRequest } from "@copilot-tracker/shared";
import { NextRequest, NextResponse } from "next/server";

import { authenticateIngestRequest } from "@/lib/auth";
import { upsertChatRequests } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await authenticateIngestRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { requests?: CopilotChatRequest[] };
  if (!Array.isArray(body.requests)) {
    return NextResponse.json(
      { error: "requests must be an array" },
      { status: 400 },
    );
  }

  const validRequests = body.requests.filter(
    (chatRequest) =>
      chatRequest.requestRecordId &&
      chatRequest.sessionId &&
      chatRequest.workspaceId,
  );
  await upsertChatRequests(validRequests, user);

  return NextResponse.json(
    { ok: true, upserted: validRequests.length },
    { status: 202 },
  );
}
