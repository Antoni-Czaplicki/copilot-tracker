import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { formatNumber, publicLeaderboard } from '@/lib/analytics';
import { readDatabase } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const database = await readDatabase();
  const rows = publicLeaderboard(database);

  return (
    <main className="stack">
      <section className="page-title">
        <div>
          <h1>Public leaderboard</h1>
          <p>Team-level visibility into Copilot token usage. Detailed request history remains in personal and admin views.</p>
        </div>
        <Badge>{rows.length} developers</Badge>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Token usage by developer</CardTitle>
          <CardDescription>Sorted by total tokens captured from VS Code chat session metadata.</CardDescription>
        </CardHeader>
        <CardContent className="table-wrap">
          <Table>
            <THead>
              <TR>
                <TH>Rank</TH>
                <TH>Developer</TH>
                <TH>Requests</TH>
                <TH>Input</TH>
                <TH>Output</TH>
                <TH>Total</TH>
                <TH>Avg/request</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((row) => (
                <TR key={row.githubLogin}>
                  <TD>#{row.rank}</TD>
                  <TD><strong>@{row.githubLogin}</strong></TD>
                  <TD>{formatNumber(row.requestCount)}</TD>
                  <TD>{formatNumber(row.inputTokens)}</TD>
                  <TD>{formatNumber(row.outputTokens)}</TD>
                  <TD>{formatNumber(row.totalTokens)}</TD>
                  <TD>{formatNumber(row.averageTokensPerRequest)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
