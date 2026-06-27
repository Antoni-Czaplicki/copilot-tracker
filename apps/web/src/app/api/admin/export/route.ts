import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  developerTaskSummaries,
  modelSummaries,
  publicLeaderboard,
  taskSummaries,
} from "@/lib/analytics";
import { currentUser, isAdmin } from "@/lib/auth";
import { estimateRequestsCost } from "@/lib/pricing";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const database = await readDatabase();
  const type = request.nextUrl.searchParams.get("type") ?? "requests";
  const csv = exportCsv(type, database);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="copilot-${type}.csv"`,
    },
  });
}

function exportCsv(
  type: string,
  database: Awaited<ReturnType<typeof readDatabase>>,
) {
  switch (type) {
    case "developers": {
      return toCsv(
        [
          "rank",
          "githubLogin",
          "requests",
          "missing",
          "inputTokens",
          "outputTokens",
          "totalTokens",
          "averageTokensPerRequest",
        ],
        publicLeaderboard(database).map((row) => [
          row.rank,
          row.githubLogin,
          row.requestCount,
          row.missingTokenCount,
          row.inputTokens,
          row.outputTokens,
          row.totalTokens,
          row.averageTokensPerRequest,
        ]),
      );
    }
    case "tasks": {
      return toCsv(
        [
          "task",
          "repositoryRoot",
          "branch",
          "requests",
          "inputTokens",
          "outputTokens",
          "totalTokens",
          "estimatedUsd",
          "estimatedAiCredits",
        ],
        taskSummaries(database.chatRequests).map((row) => {
          const matching = database.chatRequests.filter(
            (request) =>
              (request.selectedTask ?? "No task") === row.task &&
              (request.repositoryRoot ?? null) === row.repositoryRoot &&
              (request.branch ?? null) === row.branch,
          );
          const cost = estimateRequestsCost(matching);
          return [
            row.task,
            row.repositoryRoot,
            row.branch,
            row.requestCount,
            row.inputTokens,
            row.outputTokens,
            row.totalTokens,
            cost.estimatedUsd,
            cost.estimatedAiCredits,
          ];
        }),
      );
    }
    case "developer-tasks": {
      return toCsv(
        [
          "githubLogin",
          "githubId",
          "task",
          "requests",
          "inputTokens",
          "outputTokens",
          "totalTokens",
        ],
        developerTaskSummaries(database.chatRequests).map((row) => [
          row.githubLogin,
          row.githubId,
          row.task,
          row.requestCount,
          row.inputTokens,
          row.outputTokens,
          row.totalTokens,
        ]),
      );
    }
    case "models": {
      return toCsv(
        ["model", "requests", "inputTokens", "outputTokens", "totalTokens"],
        modelSummaries(database.chatRequests).map((row) => [
          row.model,
          row.requestCount,
          row.inputTokens,
          row.outputTokens,
          row.totalTokens,
        ]),
      );
    }
    case "github-billing": {
      return toCsv(
        [
          "scopeType",
          "scope",
          "date",
          "product",
          "sku",
          "quantity",
          "unitType",
          "grossAmount",
          "discountAmount",
          "netAmount",
          "fetchedAt",
        ],
        database.githubCopilotBillingUsage.map((row) => [
          row.scopeType,
          row.scope,
          row.date,
          row.product,
          row.sku,
          row.quantity,
          row.unitType,
          row.grossAmount,
          row.discountAmount,
          row.netAmount,
          row.fetchedAt,
        ]),
      );
    }
    default: {
      return toCsv(
        [
          "requestRecordId",
          "githubLogin",
          "sessionTitle",
          "branch",
          "selectedTask",
          "modelId",
          "inputTokens",
          "outputTokens",
          "totalTokens",
          "capturedAt",
        ],
        database.chatRequests.map((row) => [
          row.requestRecordId,
          row.githubLogin,
          row.sessionTitle,
          row.branch,
          row.selectedTask,
          row.modelId,
          row.inputTokens,
          row.outputTokens,
          row.totalTokens,
          row.capturedAt,
        ]),
      );
    }
  }
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [
    headers.map((header) => csvCell(header)).join(","),
    ...rows.map((row) => row.map((value) => csvCell(value)).join(",")),
  ].join("\n");
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replaceAll('"', '""')}"`;
}
