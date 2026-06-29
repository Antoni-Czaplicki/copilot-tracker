import { DashboardOverview } from "@/components/dashboard-overview";
import { LinkButton } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currentUser } from "@/lib/auth";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Promise<{
    auth?: string;
    taskPage?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const parameters = await searchParams;
  const user = await currentUser();
  if (user !== null) {
    const database = await readDatabase();
    const requests = database.chatRequests.filter(
      (request) => request.githubId === user.githubId,
    );
    return (
      <DashboardOverview
        login={user.login}
        requests={requests}
        taskPage={parsePage(parameters?.taskPage)}
        taskPageBasePath="/"
      />
    );
  }

  const authError = parameters?.auth;

  return (
    <main className="grid gap-4">
      {authError === "misconfigured" ? (
        <Card>
          <CardHeader>
            <CardTitle>GitHub login is not configured</CardTitle>
            <CardDescription>
              Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET for this deployment,
              then try logging in again.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-[28px] leading-[1.2] font-semibold">
            Assign Copilot usage to the work it actually supported.
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-[720px] text-sm">
            The VS Code extension captures Copilot chat metadata, token counts
            when VS Code persists them, workspace context, branch, and task
            assignment. This web app turns that stream into team-visible usage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LinkButton
            href="https://github.com/Antoni-Czaplicki/copilot-tracker"
            rel="noreferrer"
            target="_blank"
            variant="outline"
          >
            <ExternalLink aria-hidden="true" data-icon="inline-start" />
            GitHub
          </LinkButton>
          <LinkButton href="/api/auth/github">Log in with GitHub</LinkButton>
        </div>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="text-muted-foreground mb-1.5 text-xs">
              Default task source
            </div>
            <div className="text-2xl font-bold">Branch</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-muted-foreground mb-1.5 text-xs">
              Privacy baseline
            </div>
            <div className="text-2xl font-bold">No prompts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-muted-foreground mb-1.5 text-xs">Auth</div>
            <div className="text-2xl font-bold">GitHub</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-muted-foreground mb-1.5 text-xs">Views</div>
            <div className="text-2xl font-bold">Team + Admin</div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>How automatic task detection works</CardTitle>
          <CardDescription>
            The extension makes the first assignment without asking the
            developer to babysit it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            On each sync, the extension reads the current Git branch and uses
            the first number as the Azure DevOps work item id. Branches like{" "}
            <strong>124</strong>, <strong>124v2</strong>, and{" "}
            <strong>feature/124-login</strong>
            all map to task <strong>124</strong>. If there is no number, it
            falls back to the full branch name. Developers can override the task
            from VS Code or later in this dashboard; when the branch changes,
            the extension asks before switching away from a manually selected
            task.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
