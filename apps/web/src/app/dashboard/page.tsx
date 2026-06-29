import { redirect } from "next/navigation";

import { DashboardOverview } from "@/components/dashboard-overview";
import { currentUser } from "@/lib/auth";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ taskPage?: string }>;
}) {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }

  const params = await searchParams;
  const database = await readDatabase();
  const requests = database.chatRequests.filter(
    (request) => request.userId === user.userId,
  );
  return (
    <DashboardOverview
      githubLogin={user.githubLogin}
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
