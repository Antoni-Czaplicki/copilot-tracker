import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  developerTaskSummaries,
  filterMeaningfulChatRequests,
  modelSummaries,
  publicLeaderboard,
  taskSummaries,
} from "@/lib/analytics";
import { currentUser, isAdmin } from "@/lib/auth";
import { estimateRequestsCost } from "@/lib/pricing";
import { readDatabase } from "@/lib/store";

export const dynamic = "force-dynamic";

const exportTypes = [
  "requests",
  "developers",
  "tasks",
  "developer-tasks",
  "models",
  "github-billing",
] as const;

type ExportType = (typeof exportTypes)[number];

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const database = await readDatabase();
  const type = parseExportType(
    request.nextUrl.searchParams.get("type") ?? "requests",
  );
  if (type === null) {
    return NextResponse.json(
      { error: "unsupported export type" },
      { status: 400 },
    );
  }

  const csv = exportCsv(type, database);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="copilot-${type}.csv"`,
    },
  });
}

function exportCsv(
  type: ExportType,
  database: Awaited<ReturnType<typeof readDatabase>>,
) {
  const chatRequests = filterMeaningfulChatRequests(database.chatRequests);
  switch (type) {
    case "requests": {
      return toCsv(
        [
          "requestRecordId",
          "userLogin",
          "userId",
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
        chatRequests.map((row) => [
          row.requestRecordId,
          row.userLogin,
          row.userId,
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
    case "developers": {
      return toCsv(
        [
          "rank",
          "userLogin",
          "userId",
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
          row.userLogin,
          row.userId,
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
        taskSummaries(chatRequests).map((row) => {
          const matching = chatRequests.filter(
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
          "userLogin",
          "userId",
          "githubLogin",
          "task",
          "requests",
          "inputTokens",
          "outputTokens",
          "totalTokens",
        ],
        developerTaskSummaries(chatRequests).map((row) => [
          row.userLogin,
          row.userId,
          row.githubLogin,
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
        modelSummaries(chatRequests).map((row) => [
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
  }
}

function parseExportType(value: string): ExportType | null {
  return isExportType(value) ? value : null;
}

function isExportType(value: string): value is ExportType {
  return exportTypes.includes(value as ExportType);
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
