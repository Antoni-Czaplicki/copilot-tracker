import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { TaskEditor } from '@/components/task-editor';
import { currentUser, isAdmin } from '@/lib/auth';
import {
  developerTaskSummaries,
  formatNumber,
  modelSummaries,
  publicLeaderboard,
  summarizeRequests,
  taskSummaries,
} from '@/lib/analytics';
import { estimateRequestsCost, formatCurrency } from '@/lib/pricing';
import { readDatabase } from '@/lib/store';

export const dynamic = 'force-dynamic';

type AdminView = 'overview' | 'tasks' | 'developer-tasks' | 'models' | 'requests' | 'github-billing';

const views: Array<{ id: AdminView; label: string; exportType: string }> = [
  { id: 'overview', label: 'Overview', exportType: 'developers' },
  { id: 'tasks', label: 'Tasks', exportType: 'tasks' },
  { id: 'developer-tasks', label: 'People x tasks', exportType: 'developer-tasks' },
  { id: 'models', label: 'Models', exportType: 'models' },
  { id: 'requests', label: 'Requests', exportType: 'requests' },
  { id: 'github-billing', label: 'GitHub billing', exportType: 'github-billing' },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await currentUser();
  if (!isAdmin(user)) {
    redirect('/');
  }

  const params = await searchParams;
  const view = normalizeView(params.view);
  const currentView = views.find((entry) => entry.id === view) ?? views[0];
  const database = await readDatabase();
  const metrics = summarizeRequests(database.chatRequests);
  const cost = estimateRequestsCost(database.chatRequests);

  return (
    <main className="stack">
      <section className="page-title">
        <div>
          <h1>Admin overview</h1>
          <p>Full team usage, task attribution, model cost estimates, GitHub billing sync, and CSV exports.</p>
        </div>
        <Badge>Admin</Badge>
      </section>

      <section className="metrics-grid">
        <Metric label="Captured requests" value={metrics.requestCount} />
        <Metric label="Total tokens" value={metrics.totalTokens} />
        <Metric label="Estimated AI credits" value={Math.round(cost.estimatedAiCredits)} />
        <Metric label="Estimated cost" value={formatCurrency(cost.estimatedUsd)} />
      </section>

      <section className="inline-actions">
        {views.map((entry) => (
          <LinkButton
            key={entry.id}
            href={`/admin?view=${entry.id}`}
            variant={entry.id === view ? 'default' : 'outline'}
          >
            {entry.label}
          </LinkButton>
        ))}
        <LinkButton href={`/api/admin/export?type=${currentView.exportType}`} variant="secondary">
          Export CSV
        </LinkButton>
      </section>

      {view === 'overview' && <Overview database={database} />}
      {view === 'tasks' && <Tasks database={database} />}
      {view === 'developer-tasks' && <DeveloperTasks database={database} />}
      {view === 'models' && <Models database={database} />}
      {view === 'requests' && <Requests database={database} />}
      {view === 'github-billing' && <GithubBilling database={database} />}
    </main>
  );
}

function Overview({ database }: { database: Awaited<ReturnType<typeof readDatabase>> }) {
  const leaderboard = publicLeaderboard(database);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developers</CardTitle>
        <CardDescription>Public leaderboard plus admin-visible totals.</CardDescription>
      </CardHeader>
      <CardContent className="table-wrap">
        <Table>
          <THead>
            <TR>
              <TH>Developer</TH>
              <TH>Requests</TH>
              <TH>Missing</TH>
              <TH>Total tokens</TH>
              <TH>Average</TH>
            </TR>
          </THead>
          <TBody>
            {leaderboard.map((row) => (
              <TR key={row.githubLogin}>
                <TD><strong>@{row.githubLogin}</strong></TD>
                <TD>{formatNumber(row.requestCount)}</TD>
                <TD>{formatNumber(row.missingTokenCount)}</TD>
                <TD>{formatNumber(row.totalTokens)}</TD>
                <TD>{formatNumber(row.averageTokensPerRequest)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Tasks({ database }: { database: Awaited<ReturnType<typeof readDatabase>> }) {
  const rows = taskSummaries(database.chatRequests);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Per task usage</CardTitle>
        <CardDescription>Azure DevOps numeric task attribution with local estimated AI credit cost.</CardDescription>
      </CardHeader>
      <CardContent className="table-wrap">
        <Table>
          <THead>
            <TR>
              <TH>Task</TH>
              <TH>Branch</TH>
              <TH>Requests</TH>
              <TH>Total tokens</TH>
              <TH>Estimated cost</TH>
              <TH>Priced</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => {
              const matching = database.chatRequests.filter((request) => (
                (request.selectedTask ?? 'No task') === row.task
                && (request.repositoryRoot ?? null) === row.repositoryRoot
                && (request.branch ?? null) === row.branch
              ));
              const cost = estimateRequestsCost(matching);
              return (
                <TR key={`${row.task}-${row.repositoryRoot}-${row.branch}`}>
                  <TD><strong>{row.task}</strong></TD>
                  <TD>{row.branch ?? 'none'}</TD>
                  <TD>{formatNumber(row.requestCount)}</TD>
                  <TD>{formatNumber(row.totalTokens)}</TD>
                  <TD>{formatCurrency(cost.estimatedUsd)}</TD>
                  <TD>{formatNumber(cost.pricedRequestCount)} / {formatNumber(row.requestCount)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DeveloperTasks({ database }: { database: Awaited<ReturnType<typeof readDatabase>> }) {
  const rows = developerTaskSummaries(database.chatRequests);
  return (
    <Card>
      <CardHeader>
        <CardTitle>People x tasks</CardTitle>
        <CardDescription>Shows which developers generated usage against each assigned task.</CardDescription>
      </CardHeader>
      <CardContent className="table-wrap">
        <Table>
          <THead>
            <TR>
              <TH>Developer</TH>
              <TH>Task</TH>
              <TH>Requests</TH>
              <TH>Input</TH>
              <TH>Output</TH>
              <TH>Total</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={`${row.githubLogin}-${row.task}`}>
                <TD>@{row.githubLogin}</TD>
                <TD><strong>{row.task}</strong></TD>
                <TD>{formatNumber(row.requestCount)}</TD>
                <TD>{formatNumber(row.inputTokens)}</TD>
                <TD>{formatNumber(row.outputTokens)}</TD>
                <TD>{formatNumber(row.totalTokens)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Models({ database }: { database: Awaited<ReturnType<typeof readDatabase>> }) {
  const rows = modelSummaries(database.chatRequests);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model usage</CardTitle>
        <CardDescription>Token usage grouped by captured Copilot model id.</CardDescription>
      </CardHeader>
      <CardContent className="table-wrap">
        <Table>
          <THead>
            <TR>
              <TH>Model</TH>
              <TH>Requests</TH>
              <TH>Input</TH>
              <TH>Output</TH>
              <TH>Total</TH>
              <TH>Estimated cost</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => {
              const matching = database.chatRequests.filter((request) => (
                (request.modelId ?? request.resolvedModel ?? request.modelName ?? 'unknown') === row.model
              ));
              return (
                <TR key={row.model}>
                  <TD><strong>{row.model}</strong></TD>
                  <TD>{formatNumber(row.requestCount)}</TD>
                  <TD>{formatNumber(row.inputTokens)}</TD>
                  <TD>{formatNumber(row.outputTokens)}</TD>
                  <TD>{formatNumber(row.totalTokens)}</TD>
                  <TD>{formatCurrency(estimateRequestsCost(matching).estimatedUsd)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Requests({ database }: { database: Awaited<ReturnType<typeof readDatabase>> }) {
  const recentRequests = [...database.chatRequests]
    .sort((a, b) => Date.parse(b.requestStartedAt ?? b.capturedAt) - Date.parse(a.requestStartedAt ?? a.capturedAt))
    .slice(0, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent team requests</CardTitle>
        <CardDescription>Prompt and response bodies are not stored; this table shows metadata only.</CardDescription>
      </CardHeader>
      <CardContent className="table-wrap">
        <Table>
          <THead>
            <TR>
              <TH>Developer</TH>
              <TH>Session</TH>
              <TH>Branch</TH>
              <TH>Model</TH>
              <TH>Tokens</TH>
              <TH>Task</TH>
            </TR>
          </THead>
          <TBody>
            {recentRequests.map((request) => (
              <TR key={request.requestRecordId}>
                <TD>@{request.githubLogin ?? 'unknown'}</TD>
                <TD>{request.sessionTitle ?? request.sessionId}</TD>
                <TD>{request.branch ?? 'none'}</TD>
                <TD>{request.modelId ?? 'unknown'}</TD>
                <TD>{request.totalTokens === null ? 'missing' : formatNumber(request.totalTokens)}</TD>
                <TD>
                  <TaskEditor
                    initialTask={request.selectedTask ?? request.defaultTask ?? 'No task'}
                    requestRecordId={request.requestRecordId}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function GithubBilling({ database }: { database: Awaited<ReturnType<typeof readDatabase>> }) {
  const rows = [...database.githubCopilotBillingUsage]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub AI credit billing</CardTitle>
        <CardDescription>Synced from GitHub billing AI credit usage. Configure a daily cron against the sync API.</CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <section className="inline-actions">
          <LinkButton href="/api/admin/github-billing/sync" variant="secondary">Sync now</LinkButton>
        </section>
        <div className="table-wrap">
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Scope</TH>
                <TH>Product</TH>
                <TH>SKU</TH>
                <TH>Quantity</TH>
                <TH>Net amount</TH>
                <TH>Fetched</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.id}>
                  <TD>{row.date}</TD>
                  <TD>{row.scopeType}:{row.scope}</TD>
                  <TD>{row.product ?? 'unknown'}</TD>
                  <TD>{row.sku ?? 'unknown'}</TD>
                  <TD>{row.quantity ?? 'unknown'} {row.unitType ?? ''}</TD>
                  <TD>{row.netAmount ?? 'unknown'}</TD>
                  <TD>{new Date(row.fetchedAt).toLocaleString()}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{typeof value === 'number' ? formatNumber(value) : value}</div>
      </CardContent>
    </Card>
  );
}

function normalizeView(view: string | undefined): AdminView {
  return views.some((entry) => entry.id === view) ? view as AdminView : 'overview';
}

