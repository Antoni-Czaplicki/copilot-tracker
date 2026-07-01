import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { normalizeGithubLogin } from "@/lib/githubLogin";
import { updateUserGithubLogin } from "@/lib/store";

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await readJsonObject(request);
  if (body === null) {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  let githubLogin: string | null;
  try {
    githubLogin = normalizeGithubLogin(body.githubLogin);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid username" },
      { status: 400 },
    );
  }

  await updateUserGithubLogin(user.userId, githubLogin);
  return NextResponse.json({ ok: true, githubLogin });
}

async function readJsonObject(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    return isRecord(body) ? body : {};
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
