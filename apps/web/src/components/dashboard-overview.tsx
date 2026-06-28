import type { CopilotChatRequest } from "@copilot-tracker/shared";

import { TaskEditor } from "@/components/task-editor";
import { TaskTokenChart } from "@/components/task-token-chart";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
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
  formatDateTime,
  formatNumber,
  getRepositoryName,
  summarizeRequests,
  taskSummaries,
} from "@/lib/analytics";
import { formatCurrency } from "@/lib/pricing";

interface DashboardOverviewProps {
  login: string;
  requests: CopilotChatRequest[];
  taskPage?: number;
  taskPageBasePath?: string;
}

const taskPageSize = 10;

export function DashboardOverview({
  login,
  requests,
  taskPage = 1,
  taskPageBasePath = "/dashboard",
}: DashboardOverviewProps) {
  const metrics = summarizeRequests(requests);
  const summaries = taskSummaries(requests);
  const taskPageCount = Math.max(1, Math.ceil(summaries.length / taskPageSize));
  const currentTaskPage = Math.min(Math.max(taskPage, 1), taskPageCount);
  const paginatedSummaries = summaries.slice(
    (currentTaskPage - 1) * taskPageSize,
    currentTaskPage * taskPageSize,
  );
  const recentRequests = [...requests]
    .sort(
      (a, b) =>
        Date.parse(b.requestStartedAt ?? b.capturedAt) -
        Date.parse(a.requestStartedAt ?? a.capturedAt),
    )
    .slice(0, 20);
  const chartData = summaries.slice(0, 8).map((summary) => ({
    task: summary.task,
    input: summary.inputTokens,
    output: summary.outputTokens,
  }));

  return (
    <main className="grid gap-4">
      <section className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-[28px] leading-[1.2] font-semibold">
            Your Copilot usage
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-[720px] text-sm">
            Review token usage, see which tasks it belongs to, and correct
            assignments when the branch guess was wrong.
          </p>
        </div>
        <Badge>@{login}</Badge>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Requests" value={metrics.requestCount} />
        <Metric label="Input tokens" value={metrics.inputTokens} />
        <Metric label="Output tokens" value={metrics.outputTokens} />
        <Metric
          label="Avg tokens/request"
          value={metrics.averageTokensPerRequest}
        />
        <Metric
          label="Estimated cost"
          value={formatCurrency(metrics.estimatedUsd)}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Token usage by task</CardTitle>
          <CardDescription>
            Input and output tokens grouped by selected Azure DevOps task.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <TaskTokenChart data={chartData} />
          ) : (
            <p className="text-muted-foreground">
              No tokenized Copilot requests have been captured yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            Grouped by selected task, repository, and branch. Newest task
            activity is shown first.
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
                <TableHead>Total</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Last request</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSummaries.map((summary) => (
                <TableRow
                  key={`${summary.task}-${summary.repositoryRoot}-${summary.branch}`}
                >
                  <TableCell>
                    <strong>{summary.task}</strong>
                  </TableCell>
                  <TableCell>{summary.repositoryName}</TableCell>
                  <TableCell>{summary.branch ?? "none"}</TableCell>
                  <TableCell>{formatNumber(summary.requestCount)}</TableCell>
                  <TableCell>{formatNumber(summary.totalTokens)}</TableCell>
                  <TableCell>{formatCurrency(summary.estimatedUsd)}</TableCell>
                  <TableCell>{formatDateTime(summary.lastRequestAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {taskPageCount > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                Page {formatNumber(currentTaskPage)} of{" "}
                {formatNumber(taskPageCount)}
              </p>
              <div className="flex items-center gap-2">
                {currentTaskPage > 1 ? (
                  <LinkButton
                    href={taskPageHref(taskPageBasePath, currentTaskPage - 1)}
                    variant="outline"
                  >
                    Previous
                  </LinkButton>
                ) : null}
                {currentTaskPage < taskPageCount ? (
                  <LinkButton
                    href={taskPageHref(taskPageBasePath, currentTaskPage + 1)}
                    variant="outline"
                  >
                    Next
                  </LinkButton>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent requests</CardTitle>
          <CardDescription>
            Task reassignment updates future summaries immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Repo</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Task</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((request) => (
                <TableRow key={request.requestRecordId}>
                  <TableCell>
                    {request.sessionTitle ?? request.sessionId}
                  </TableCell>
                  <TableCell>{getRepositoryName(request)}</TableCell>
                  <TableCell>{request.modelId ?? "unknown"}</TableCell>
                  <TableCell>
                    {request.totalTokens === null
                      ? "missing"
                      : formatNumber(request.totalTokens)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(summarizeRequests([request]).estimatedUsd)}
                  </TableCell>
                  <TableCell>
                    <TaskEditor
                      initialTask={
                        request.selectedTask ?? request.defaultTask ?? "No task"
                      }
                      requestRecordId={request.requestRecordId}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
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

function taskPageHref(basePath: string, page: number) {
  const params = new URLSearchParams();
  params.set("taskPage", String(page));
  return `${basePath}?${params.toString()}`;
}
