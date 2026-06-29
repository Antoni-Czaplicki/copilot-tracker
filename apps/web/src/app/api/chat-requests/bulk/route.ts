import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { currentUser, isAdmin } from "@/lib/auth";
import { taskAssignmentSchema } from "@/lib/payloadSchemas";
import { updateChatRequestTasks } from "@/lib/store";

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = taskAssignmentSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json(
      { error: "invalid task assignment" },
      { status: 400 },
    );
  }

  const requestRecordIds = payload.data.requestRecordIds ?? [];
  const sessionId = payload.data.sessionId;

  if (requestRecordIds.length === 0 && !sessionId) {
    return NextResponse.json(
      { error: "requestRecordIds or sessionId is required" },
      { status: 400 },
    );
  }

  const updated = await updateChatRequestTasks({
    requestRecordIds,
    sessionId,
    selectedTask: payload.data.selectedTask,
    user,
    canEditAll: isAdmin(user),
  });

  return NextResponse.json({ ok: true, updated });
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    const payload: unknown = await request.json();
    return payload;
  } catch {
    return null;
  }
}
