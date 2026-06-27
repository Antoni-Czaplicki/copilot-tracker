import type { CopilotChatRequest } from "@copilot-tracker/shared";

import { TaskEditor } from "@/components/task-editor";
import { TaskTokenChart } from "@/components/task-token-chart";
import { Badge } from "@/components/ui/badge";
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
  formatNumber,
  summarizeRequests,
  taskSummaries,
} from "@/lib/analytics";

interface DashboardOverviewProps {
  login: string;
  requests: CopilotChatRequest[];
}

export function DashboardOverview({ login, requests }: DashboardOverviewProps) {
  const metrics = summarizeRequests(requests);
  const summaries = taskSummaries(requests);
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
    <main className="stack">
      <section className="page-title">
        <div>
          <h1>Your Copilot usage</h1>
          <p>
            Review token usage, see which tasks it belongs to, and correct
            assignments when the branch guess was wrong.
          </p>
        </div>
        <Badge>@{login}</Badge>
      </section>

      <section className="metrics-grid">
        <Metric label="Requests" value={metrics.requestCount} />
        <Metric label="Input tokens" value={metrics.inputTokens} />
        <Metric label="Output tokens" value={metrics.outputTokens} />
        <Metric
          label="Avg tokens/request"
          value={metrics.averageTokensPerRequest}
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
            <p className="muted">
              No tokenized Copilot requests have been captured yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            Grouped by selected task, repository, and branch.
          </CardDescription>
        </CardHeader>
        <CardContent className="table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => (
                <TableRow
                  key={`${summary.task}-${summary.repositoryRoot}-${summary.branch}`}
                >
                  <TableCell>
                    <strong>{summary.task}</strong>
                  </TableCell>
                  <TableCell>{summary.branch ?? "none"}</TableCell>
                  <TableCell>{formatNumber(summary.requestCount)}</TableCell>
                  <TableCell>{formatNumber(summary.inputTokens)}</TableCell>
                  <TableCell>{formatNumber(summary.outputTokens)}</TableCell>
                  <TableCell>{formatNumber(summary.totalTokens)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent requests</CardTitle>
          <CardDescription>
            Task reassignment updates future summaries immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Task</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((request) => (
                <TableRow key={request.requestRecordId}>
                  <TableCell>
                    {request.sessionTitle ?? request.sessionId}
                  </TableCell>
                  <TableCell>{request.modelId ?? "unknown"}</TableCell>
                  <TableCell>
                    {request.totalTokens === null
                      ? "missing"
                      : formatNumber(request.totalTokens)}
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{formatNumber(value)}</div>
      </CardContent>
    </Card>
  );
}
