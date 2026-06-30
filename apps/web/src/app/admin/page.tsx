import { redirect } from "next/navigation";

import { GithubLoginEditor } from "@/components/github-login-editor";
import { RequestSessionsGrid } from "@/components/request-sessions-grid";
import { Badge } from "@/components/ui/badge";
import { AnchorButton, LinkButton } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  developerTaskSummaries,
  filterMeaningfulChatRequests,
  formatDateTime,
  formatNumber,
  modelSummaries,
  publicLeaderboard,
  summarizeRequests,
  taskSummaries,
} from "@/lib/analytics";
import { currentUser, isAdmin } from "@/lib/auth";
import { estimateRequestsCost, formatCurrency } from "@/lib/pricing";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

type AdminView =
  | "overview"
  | "tasks"
  | "developer-tasks"
  | "models"
  | "requests"
  | "github-billing";

const views: { id: AdminView; label: string; exportType: string }[] = [
  { id: "overview", label: "Overview", exportType: "developers" },
  { id: "tasks", label: "Tasks", exportType: "tasks" },
  {
    id: "developer-tasks",
    label: "People x tasks",
    exportType: "developer-tasks",
  },
  { id: "models", label: "Models", exportType: "models" },
  { id: "requests", label: "Requests", exportType: "requests" },
  {
    id: "github-billing",
    label: "GitHub billing",
    exportType: "github-billing",
  },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await currentUser();
  if (!isAdmin(user)) {
    redirect("/");
  }

  const params = await searchParams;
  const view = normalizeView(params.view);
  const currentView = views.find((entry) => entry.id === view) ?? views[0];
  const database = await readDatabase();
  const visibleDatabase = {
    ...database,
    chatRequests: filterMeaningfulChatRequests(database.chatRequests),
  };
  const metrics = summarizeRequests(visibleDatabase.chatRequests);
  const cost = estimateRequestsCost(visibleDatabase.chatRequests);

  return (
    <main className="grid gap-4">
      <section className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-[28px] leading-[1.2] font-semibold">
            Admin overview
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-[720px] text-sm">
            Full team usage, task attribution, model cost estimates, GitHub
            username mapping, billing sync, and CSV exports.
          </p>
        </div>
        <Badge>Admin</Badge>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Captured requests" value={metrics.requestCount} />
        <Metric label="Total tokens" value={metrics.totalTokens} />
        <Metric
          label="Estimated AI credits"
          value={Math.round(cost.estimatedAiCredits)}
        />
        <Metric
          label="Estimated cost"
          value={formatCurrency(cost.estimatedUsd)}
        />
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {views.map((entry) => (
          <LinkButton
            key={entry.id}
            aria-current={entry.id === view ? "page" : undefined}
            href={`/admin?view=${entry.id}`}
            variant={entry.id === view ? "default" : "outline"}
          >
            {entry.label}
          </LinkButton>
        ))}
        <LinkButton
          href={`/api/admin/export?type=${currentView.exportType}`}
          variant="secondary"
        >
          Export CSV
        </LinkButton>
      </section>

      {view === "overview" && <Overview database={visibleDatabase} />}
      {view === "tasks" && <Tasks database={visibleDatabase} />}
      {view === "developer-tasks" && (
        <DeveloperTasks database={visibleDatabase} />
      )}
      {view === "models" && <Models database={visibleDatabase} />}
      {view === "requests" && <Requests database={visibleDatabase} />}
      {view === "github-billing" && <GithubBilling database={database} />}
    </main>
  );
}

function Overview({
  database,
}: {
  database: Awaited<ReturnType<typeof readDatabase>>;
}) {
  const leaderboard = publicLeaderboard(database);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developers</CardTitle>
        <CardDescription>
          Public leaderboard plus admin-visible totals.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Developer</TableHead>
              <TableHead>GitHub username</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Missing</TableHead>
              <TableHead>Total tokens</TableHead>
              <TableHead>Average</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((row) => (
              <TableRow key={row.userId ?? row.userLogin}>
                <TableCell>
                  <strong>{row.userLogin}</strong>
                </TableCell>
                <TableCell>
                  {row.userId ? (
                    <GithubLoginEditor
                      endpoint={`/api/admin/users/${encodeURIComponent(row.userId)}/github-login`}
                      initialGithubLogin={row.githubLogin}
                    />
                  ) : (
                    "unknown"
                  )}
                </TableCell>
                <TableCell>{formatNumber(row.requestCount)}</TableCell>
                <TableCell>{formatNumber(row.missingTokenCount)}</TableCell>
                <TableCell>{formatNumber(row.totalTokens)}</TableCell>
                <TableCell>
                  {formatNumber(row.averageTokensPerRequest)}
                </TableCell>
                <TableCell>{formatCurrency(row.estimatedUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Tasks({
  database,
}: {
  database: Awaited<ReturnType<typeof readDatabase>>;
}) {
  const rows = taskSummaries(database.chatRequests);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Per task usage</CardTitle>
        <CardDescription>
          Azure DevOps numeric task attribution with local estimated AI credit
          cost.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Repo</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Total tokens</TableHead>
              <TableHead>Estimated cost</TableHead>
              <TableHead>Last request</TableHead>
              <TableHead>Priced</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const matching = database.chatRequests.filter(
                (request) =>
                  (request.selectedTask ?? "No task") === row.task &&
                  (request.repositoryRoot ?? null) === row.repositoryRoot &&
                  (request.branch ?? null) === row.branch,
              );
              const cost = estimateRequestsCost(matching);
              return (
                <TableRow
                  key={`${row.task}-${row.repositoryRoot}-${row.branch}`}
                >
                  <TableCell>
                    <strong>{row.task}</strong>
                  </TableCell>
                  <TableCell>{row.repositoryName}</TableCell>
                  <TableCell>{row.branch ?? "none"}</TableCell>
                  <TableCell>{formatNumber(row.requestCount)}</TableCell>
                  <TableCell>{formatNumber(row.totalTokens)}</TableCell>
                  <TableCell>{formatCurrency(cost.estimatedUsd)}</TableCell>
                  <TableCell>{formatDateTime(row.lastRequestAt)}</TableCell>
                  <TableCell>
                    {formatNumber(cost.pricedRequestCount)} /{" "}
                    {formatNumber(row.requestCount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DeveloperTasks({
  database,
}: {
  database: Awaited<ReturnType<typeof readDatabase>>;
}) {
  const rows = developerTaskSummaries(database.chatRequests);
  return (
    <Card>
      <CardHeader>
        <CardTitle>People x tasks</CardTitle>
        <CardDescription>
          Shows which developers generated usage against each assigned task.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Developer</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Input</TableHead>
              <TableHead>Output</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.userId ?? row.userLogin}-${row.task}`}>
                <TableCell>
                  {row.userLogin}
                  {row.githubLogin ? (
                    <span className="text-muted-foreground ml-2 text-xs">
                      GitHub @{row.githubLogin}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  <strong>{row.task}</strong>
                </TableCell>
                <TableCell>{formatNumber(row.requestCount)}</TableCell>
                <TableCell>{formatNumber(row.inputTokens)}</TableCell>
                <TableCell>{formatNumber(row.outputTokens)}</TableCell>
                <TableCell>{formatNumber(row.totalTokens)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Models({
  database,
}: {
  database: Awaited<ReturnType<typeof readDatabase>>;
}) {
  const rows = modelSummaries(database.chatRequests);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model usage</CardTitle>
        <CardDescription>
          Token usage grouped by captured Copilot model id.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Input</TableHead>
              <TableHead>Output</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estimated cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const matching = database.chatRequests.filter(
                (request) =>
                  (request.modelId ??
                    request.resolvedModel ??
                    request.modelName ??
                    "unknown") === row.model,
              );
              return (
                <TableRow key={row.model}>
                  <TableCell>
                    <strong>{row.model}</strong>
                  </TableCell>
                  <TableCell>{formatNumber(row.requestCount)}</TableCell>
                  <TableCell>{formatNumber(row.inputTokens)}</TableCell>
                  <TableCell>{formatNumber(row.outputTokens)}</TableCell>
                  <TableCell>{formatNumber(row.totalTokens)}</TableCell>
                  <TableCell>
                    {formatCurrency(
                      estimateRequestsCost(matching).estimatedUsd,
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Requests({
  database,
}: {
  database: Awaited<ReturnType<typeof readDatabase>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team requests by session</CardTitle>
        <CardDescription>
          Prompt and response bodies are not stored. Reassign complete sessions
          or select individual request rows for narrower corrections.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RequestSessionsGrid requests={database.chatRequests} showDeveloper />
      </CardContent>
    </Card>
  );
}

function GithubBilling({
  database,
}: {
  database: Awaited<ReturnType<typeof readDatabase>>;
}) {
  const rows = [...database.githubCopilotBillingUsage]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub AI credit billing</CardTitle>
        <CardDescription>
          Synced from GitHub billing AI credit usage. Configure a daily cron
          against the sync API.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <section className="flex flex-wrap items-center gap-2">
          <AnchorButton href="/api/admin/github-billing/sync" variant="secondary">
            Sync now
          </AnchorButton>
        </section>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Net amount</TableHead>
                <TableHead>Fetched</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    {row.scopeType}:{row.scope}
                  </TableCell>
                  <TableCell>{row.product ?? "unknown"}</TableCell>
                  <TableCell>{row.sku ?? "unknown"}</TableCell>
                  <TableCell>
                    {row.quantity ?? "unknown"} {row.unitType ?? ""}
                  </TableCell>
                  <TableCell>{row.netAmount ?? "unknown"}</TableCell>
                  <TableCell>
                    {new Date(row.fetchedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
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
        <div className="text-muted-foreground mb-1.5 text-xs">{label}</div>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? formatNumber(value) : value}
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeView(view: string | undefined): AdminView {
  return views.some((entry) => entry.id === view)
    ? (view as AdminView)
    : "overview";
}
