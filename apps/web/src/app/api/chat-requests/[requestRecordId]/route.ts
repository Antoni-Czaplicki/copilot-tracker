import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { currentUser, isAdmin } from "@/lib/auth";
import { readJsonPayload } from "@/lib/jsonPayload";
import { taskAssignmentSchema } from "@/lib/payloadSchemas";
import { updateChatRequestTask } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ requestRecordId: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { requestRecordId } = await context.params;
  const payload = taskAssignmentSchema
    .pick({ selectedTask: true })
    .safeParse(await readJsonPayload(request));
  if (!payload.success) {
    return NextResponse.json(
      { error: "invalid task assignment" },
      { status: 400 },
    );
  }

  const updated = await updateChatRequestTask(
    requestRecordId,
    payload.data.selectedTask,
    user,
    isAdmin(user),
  );

  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
