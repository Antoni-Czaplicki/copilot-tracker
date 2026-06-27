import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { currentUser, isAdmin } from "@/lib/auth";
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
  const body = (await request.json()) as { selectedTask?: string };
  const selectedTask = body.selectedTask?.trim();
  if (!selectedTask) {
    return NextResponse.json(
      { error: "selectedTask is required" },
      { status: 400 },
    );
  }

  const updated = await updateChatRequestTask(
    requestRecordId,
    selectedTask,
    user,
    isAdmin(user),
  );

  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
