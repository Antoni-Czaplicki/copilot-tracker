import { redirect } from "next/navigation";

import { DashboardOverview } from "@/components/dashboard-overview";
import { currentUser } from "@/lib/auth";
import { readChatRequestsForUser } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string; taskPage?: string }>;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }

  const params = await searchParams;
  const requests = await readChatRequestsForUser(user.userId);
  return (
    <DashboardOverview
      githubLogin={user.githubLogin}
      focusedSessionId={params.sessionId ?? null}
      login={user.login}
      requests={requests}
      taskPage={parsePage(params.taskPage)}
      taskPageBasePath="/dashboard"
    />
  );
}

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
