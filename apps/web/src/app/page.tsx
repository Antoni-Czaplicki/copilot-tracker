import { LinkButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardOverview } from '@/components/dashboard-overview';
import { currentUser } from '@/lib/auth';
import { readDatabase } from '@/lib/store';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams?: Promise<{
    auth?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const user = await currentUser();
  if (user !== null) {
    const database = await readDatabase();
    const requests = database.chatRequests.filter((request) => request.githubId === user.githubId);
    return <DashboardOverview login={user.login} requests={requests} />;
  }

  const parameters = await searchParams;
  const authError = parameters?.auth;

  return (
    <main className="stack">
      {authError === 'misconfigured' ? (
        <Card>
          <CardHeader>
            <CardTitle>GitHub login is not configured</CardTitle>
            <CardDescription>
              Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET for this deployment, then try logging in again.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="page-title">
        <div>
          <h1>Assign Copilot usage to the work it actually supported.</h1>
          <p>
            The VS Code extension captures Copilot chat metadata, token counts when VS Code persists them,
            workspace context, branch, and task assignment. This web app turns that stream into team-visible usage.
          </p>
        </div>
        <LinkButton href="/api/auth/github">Log in with GitHub</LinkButton>
      </section>

      <section className="metrics-grid">
        <Card>
          <CardContent>
            <div className="metric-label">Default task source</div>
            <div className="metric-value">Branch</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="metric-label">Privacy baseline</div>
            <div className="metric-value">No prompts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="metric-label">Auth</div>
            <div className="metric-value">GitHub</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="metric-label">Views</div>
            <div className="metric-value">Team + Admin</div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>How automatic task detection works</CardTitle>
          <CardDescription>The extension makes the first assignment without asking the developer to babysit it.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="muted">
            On each sync, the extension reads the current Git branch and uses the first number as the Azure DevOps
            work item id. Branches like <strong>124</strong>, <strong>124v2</strong>, and <strong>feature/124-login</strong>
            all map to task <strong>124</strong>. If there is no number, it falls back to the full branch name.
            Developers can override the task from VS Code or later in this dashboard; when the branch changes, the
            extension asks before switching away from a manually selected task.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
