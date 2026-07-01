import { notFound, redirect } from "next/navigation";

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
import { currentUser, isAdmin } from "@/lib/auth";
import { leaderboardEnabled } from "@/lib/config";
import { formatCurrency } from "@/lib/pricing";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  if (!leaderboardEnabled()) {
    notFound();
  }

  const user = await currentUser();
  if (!isAdmin(user)) {
    redirect("/");
  }

  const database = await readDatabase();
  const rows = publicLeaderboard(database);

  return (
    <main className="grid gap-4">
      <section className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-[28px] leading-[1.2] font-semibold">
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-[720px] text-sm">
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
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Input</TableHead>
                <TableHead>Output</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estimated cost</TableHead>
                <TableHead>Avg/request</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow key={row.userId ?? row.userLogin}>
                    <TableCell>#{row.rank}</TableCell>
                    <TableCell>
                      <strong>{row.userLogin}</strong>
                      {row.githubLogin ? (
                        <span className="text-muted-foreground ml-2 text-xs">
                          GitHub @{row.githubLogin}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatNumber(row.requestCount)}</TableCell>
                    <TableCell>{formatNumber(row.inputTokens)}</TableCell>
                    <TableCell>{formatNumber(row.outputTokens)}</TableCell>
                    <TableCell>{formatNumber(row.totalTokens)}</TableCell>
                    <TableCell>{formatCurrency(row.estimatedUsd)}</TableCell>
                    <TableCell>
                      {formatNumber(row.averageTokensPerRequest)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="text-muted-foreground h-16 text-center"
                    colSpan={8}
                  >
                    No developer usage captured yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
