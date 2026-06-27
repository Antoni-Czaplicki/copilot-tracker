import { redirect } from "next/navigation";

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
import { formatNumber, publicLeaderboard } from "@/lib/analytics";
import { currentUser } from "@/lib/auth";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await currentUser();
  if (user === null) {
    redirect("/");
  }

  const database = await readDatabase();
  const rows = publicLeaderboard(database);

  return (
    <main className="stack">
      <section className="page-title">
        <div>
          <h1>Leaderboard</h1>
          <p>
            Team-level visibility into Copilot token usage. Detailed request
            history remains in personal and admin views.
          </p>
        </div>
        <Badge>{rows.length} developers</Badge>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Token usage by developer</CardTitle>
          <CardDescription>
            Sorted by total tokens captured from VS Code chat session metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="table-wrap">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Avg/request</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.githubLogin}>
                  <TableCell>#{row.rank}</TableCell>
                  <TableCell>
                    <strong>@{row.githubLogin}</strong>
                  </TableCell>
                  <TableCell>{formatNumber(row.requestCount)}</TableCell>
                  <TableCell>{formatNumber(row.inputTokens)}</TableCell>
                  <TableCell>{formatNumber(row.outputTokens)}</TableCell>
                  <TableCell>{formatNumber(row.totalTokens)}</TableCell>
                  <TableCell>
                    {formatNumber(row.averageTokensPerRequest)}
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
