import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authenticateIngestRequest } from "@/lib/auth";
import { readJsonPayload } from "@/lib/jsonPayload";
import { chatRequestBatchSchema } from "@/lib/payloadSchemas";
import { upsertChatRequests } from "@/lib/store";

export async function POST(request: NextRequest) {
  const user = await authenticateIngestRequest(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = chatRequestBatchSchema.safeParse(
    await readJsonPayload(request),
  );
  if (!payload.success) {
    return NextResponse.json(
      { error: "invalid request batch" },
      { status: 400 },
    );
  }

  const upserted = await upsertChatRequests(payload.data.requests, user);

  return NextResponse.json(
    {
      ok: true,
      received: payload.data.requests.length,
      accepted: upserted,
      upserted,
    },
    { status: 202 },
  );
}
