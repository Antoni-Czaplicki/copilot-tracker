import { CopilotChatRequest } from '@copilot-tracker/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { TaskEditor } from '@/components/task-editor';
import { TaskTokenChart } from '@/components/task-token-chart';
import { formatNumber, summarizeRequests, taskSummaries } from '@/lib/analytics';

interface DashboardOverviewProps {
  login: string;
  requests: CopilotChatRequest[];
}

export function DashboardOverview({ login, requests }: DashboardOverviewProps) {
  const metrics = summarizeRequests(requests);
  const summaries = taskSummaries(requests);
  const recentRequests = [...requests]
    .sort((a, b) => Date.parse(b.requestStartedAt ?? b.capturedAt) - Date.parse(a.requestStartedAt ?? a.capturedAt))
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
          <p>Review token usage, see which tasks it belongs to, and correct assignments when the branch guess was wrong.</p>
        </div>
        <Badge>@{login}</Badge>
      </section>

      <section className="metrics-grid">
        <Metric label="Requests" value={metrics.requestCount} />
        <Metric label="Input tokens" value={metrics.inputTokens} />
        <Metric label="Output tokens" value={metrics.outputTokens} />
        <Metric label="Avg tokens/request" value={metrics.averageTokensPerRequest} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Token usage by task</CardTitle>
          <CardDescription>Input and output tokens grouped by selected Azure DevOps task.</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <TaskTokenChart data={chartData} />
          ) : (
            <p className="muted">No tokenized Copilot requests have been captured yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>Grouped by selected task, repository, and branch.</CardDescription>
        </CardHeader>
        <CardContent className="table-wrap">
          <Table>
            <THead>
              <TR>
                <TH>Task</TH>
                <TH>Branch</TH>
                <TH>Requests</TH>
                <TH>Input</TH>
                <TH>Output</TH>
                <TH>Total</TH>
              </TR>
            </THead>
            <TBody>
              {summaries.map((summary) => (
                <TR key={`${summary.task}-${summary.repositoryRoot}-${summary.branch}`}>
                  <TD><strong>{summary.task}</strong></TD>
                  <TD>{summary.branch ?? 'none'}</TD>
                  <TD>{formatNumber(summary.requestCount)}</TD>
                  <TD>{formatNumber(summary.inputTokens)}</TD>
                  <TD>{formatNumber(summary.outputTokens)}</TD>
                  <TD>{formatNumber(summary.totalTokens)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent requests</CardTitle>
          <CardDescription>Task reassignment updates future summaries immediately.</CardDescription>
        </CardHeader>
        <CardContent className="table-wrap">
          <Table>
            <THead>
              <TR>
                <TH>Session</TH>
                <TH>Model</TH>
                <TH>Tokens</TH>
                <TH>Task</TH>
              </TR>
            </THead>
            <TBody>
              {recentRequests.map((request) => (
                <TR key={request.requestRecordId}>
                  <TD>{request.sessionTitle ?? request.sessionId}</TD>
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
