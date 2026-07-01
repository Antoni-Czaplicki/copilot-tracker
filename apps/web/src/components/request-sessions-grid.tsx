"use client";

import type { CopilotChatRequest } from "@copilot-tracker/shared";
import type { ColumnDef } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatDateTime,
  formatNumber,
  getRepositoryName,
  getRequestActivityTimestamp,
  summarizeRequests,
} from "@/lib/analytics";
import { estimateRequestsCost, formatCurrency } from "@/lib/pricing";
import { cn } from "@/lib/utils";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { DataGrid } from "./ui/data-grid";
import { TaskEditor } from "./task-editor";
import { WorkItemPicker } from "./work-item-picker";

export type RequestGridRequest = CopilotChatRequest & {
  userLogin?: string | null;
  githubLogin?: string | null;
  userId?: string | null;
};

interface RequestSessionsGridProps {
  requests: RequestGridRequest[];
  focusedSessionId?: string | null;
  showDeveloper?: boolean;
}

interface SessionGroup {
  sessionId: string;
  sessionTitle: string | null;
  sessionCreatedAt: string | null;
  requests: RequestGridRequest[];
}

export function RequestSessionsGrid({
  requests,
  focusedSessionId = null,
  showDeveloper = false,
}: RequestSessionsGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [taskOverrides, setTaskOverrides] = useState<Record<string, string>>(
    {},
  );
  const [sessionDrafts, setSessionDrafts] = useState<Record<string, string>>(
    {},
  );
  const [bulkTask, setBulkTask] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(
    () => groupRequestsBySession(requests, focusedSessionId),
    [focusedSessionId, requests],
  );
  const selectedRequests = useMemo(
    () =>
      requests.filter((request) => selectedIds.has(request.requestRecordId)),
    [requests, selectedIds],
  );

  async function applyTask({
    requestRecordIds,
    sessionId,
    selectedTask,
    key,
  }: {
    requestRecordIds?: string[];
    sessionId?: string;
    selectedTask: string;
    key: string;
  }) {
    const task = selectedTask.trim();
    if (!task) {
      setError("Choose a task before applying changes.");
      return;
    }

    setSavingKey(key);
    setError(null);
    try {
      const response = await fetch("/api/chat-requests/bulk", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestRecordIds,
          selectedTask: task,
          sessionId,
        }),
      });

      if (!response.ok) {
        setError(await readMutationError(response));
        return;
      }

      const result = await readMutationResult(response);
      if (result.updated === 0) {
        setError("No matching requests were updated.");
        return;
      }

      const affectedIds =
        requestRecordIds ??
        requests
          .filter((request) => request.sessionId === sessionId)
          .map((request) => request.requestRecordId);
      setTaskOverrides((current) => ({
        ...current,
        ...Object.fromEntries(affectedIds.map((id) => [id, task])),
      }));

      if (requestRecordIds) {
        setSelectedIds(new Set());
        setBulkTask("");
      }
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Could not update task assignments.",
      );
    } finally {
      setSavingKey(null);
    }
  }

  function handleSingleTaskSaved(requestRecordId: string, selectedTask: string) {
    setTaskOverrides((current) => ({
      ...current,
      [requestRecordId]: selectedTask,
    }));
  }

  function toggleRequest(requestRecordId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(requestRecordId);
      } else {
        next.delete(requestRecordId);
      }
      return next;
    });
  }

  function toggleSession(group: SessionGroup, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const request of group.requests) {
        if (checked) {
          next.add(request.requestRecordId);
        } else {
          next.delete(request.requestRecordId);
        }
      }
      return next;
    });
  }

  return (
    <div className="grid gap-4">
      {selectedRequests.length > 0 ? (
        <section className="border-border bg-muted/30 flex flex-col gap-3 border p-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold">
              {formatNumber(selectedRequests.length)} selected requests
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Apply one Azure DevOps task to only the selected request rows.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <WorkItemPicker value={bulkTask} onChange={setBulkTask} />
            <Button
              disabled={savingKey === "selected"}
              type="button"
              variant="secondary"
              onClick={() => {
                void applyTask({
                  requestRecordIds: [...selectedIds],
                  selectedTask: bulkTask,
                  key: "selected",
                });
              }}
            >
              {savingKey === "selected" ? "Applying" : "Apply to selected"}
            </Button>
          </div>
        </section>
      ) : null}

      {error ? (
        <p aria-live="polite" className="text-destructive text-sm" role="status">
          {error}
        </p>
      ) : null}

      {groups.map((group) => {
        const sessionTask =
          sessionDrafts[group.sessionId] ?? getCommonTask(group, taskOverrides);
        const metrics = summarizeRequests(group.requests);
        const cost = estimateRequestsCost(group.requests);
        const allSelected = group.requests.every((request) =>
          selectedIds.has(request.requestRecordId),
        );
        const someSelected =
          !allSelected &&
          group.requests.some((request) =>
            selectedIds.has(request.requestRecordId),
          );
        const sessionKey = `session:${group.sessionId}`;

        return (
          <section
            key={group.sessionId}
            id={sessionAnchor(group.sessionId)}
            className={cn(
              "border-border grid gap-3 border p-3",
              focusedSessionId === group.sessionId && "ring-ring ring-1",
            )}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <SessionSelectionCheckbox
                  allSelected={allSelected}
                  label={`Select ${group.sessionTitle ?? group.sessionId} session requests`}
                  someSelected={someSelected}
                  onChange={(checked) => {
                    toggleSession(group, checked);
                  }}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">
                      {group.sessionTitle ?? group.sessionId}
                    </h3>
                    <Badge>{formatNumber(group.requests.length)} requests</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatNumber(metrics.inputTokens)} input /{" "}
                    {formatNumber(metrics.outputTokens)} output /{" "}
                    {formatNumber(metrics.totalTokens)} total ·{" "}
                    {formatCurrency(cost.estimatedUsd)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Started {formatDateTime(group.sessionCreatedAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <WorkItemPicker
                  value={sessionTask}
                  onChange={(value) => {
                    setSessionDrafts((current) => ({
                      ...current,
                      [group.sessionId]: value,
                    }));
                  }}
                />
                <Button
                  disabled={savingKey === sessionKey}
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void applyTask({
                      sessionId: group.sessionId,
                      selectedTask: sessionTask,
                      key: sessionKey,
                    });
                  }}
                >
                  {savingKey === sessionKey ? "Applying" : "Apply to session"}
                </Button>
              </div>
            </div>

            <SessionRequestTable
              requests={group.requests}
              selectedIds={selectedIds}
              showDeveloper={showDeveloper}
              taskOverrides={taskOverrides}
              toggleRequest={toggleRequest}
              onTaskSaved={handleSingleTaskSaved}
            />
          </section>
        );
      })}
    </div>
  );
}

function SessionRequestTable({
  requests,
  selectedIds,
  showDeveloper,
  taskOverrides,
  toggleRequest,
  onTaskSaved,
}: {
  requests: RequestGridRequest[];
  selectedIds: Set<string>;
  showDeveloper: boolean;
  taskOverrides: Record<string, string>;
  toggleRequest: (requestRecordId: string, checked: boolean) => void;
  onTaskSaved: (requestRecordId: string, selectedTask: string) => void;
}) {
  const columns = useMemo<ColumnDef<RequestGridRequest>[]>(
    () => [
      {
        id: "select",
        header: "",
        cell: ({ row }) => (
          <input
            aria-label="Select request"
            checked={selectedIds.has(row.original.requestRecordId)}
            className="size-4"
            type="checkbox"
            onChange={(event) => {
              toggleRequest(
                row.original.requestRecordId,
                event.target.checked,
              );
            }}
          />
        ),
      },
      ...(showDeveloper
        ? [
            {
              id: "developer",
              header: "Developer",
              cell: ({ row }) => (
                <div>
                  <div>{row.original.userLogin ?? "unknown"}</div>
                  {row.original.githubLogin ? (
                    <div className="text-muted-foreground text-[11px]">
                      GitHub @{row.original.githubLogin}
                    </div>
                  ) : null}
                </div>
              ),
            } satisfies ColumnDef<RequestGridRequest>,
          ]
        : []),
      {
        id: "time",
        header: "Time",
        cell: ({ row }) =>
          formatDateTime(
            row.original.requestCompletedAt ??
              row.original.requestStartedAt ??
              row.original.capturedAt,
          ),
      },
      {
        id: "repo",
        header: "Repo",
        cell: ({ row }) => getRepositoryName(row.original),
      },
      {
        accessorKey: "branch",
        header: "Branch",
        cell: ({ row }) => row.original.branch ?? "none",
      },
      {
        id: "model",
        header: "Model",
        cell: ({ row }) =>
          row.original.modelId ??
          row.original.resolvedModel ??
          row.original.modelName ??
          "unknown",
      },
      {
        id: "tokens",
        header: "Tokens",
        cell: ({ row }) => (
          <div>
            <div>
              {formatNumber(row.original.inputTokens ?? 0)} /{" "}
              {formatNumber(row.original.outputTokens ?? 0)}
            </div>
            <div className="text-muted-foreground text-[11px]">
              {formatTokenCaptureLabel(row.original)}
            </div>
          </div>
        ),
      },
      {
        id: "cost",
        header: "Cost",
        cell: ({ row }) => formatRequestCost(row.original),
      },
      {
        id: "task",
        header: "Task",
        cell: ({ row }) => {
          const currentTask = getCurrentTask(row.original, taskOverrides);
          return (
            <TaskEditor
              key={`${row.original.requestRecordId}:${currentTask}`}
              initialTask={currentTask}
              requestRecordId={row.original.requestRecordId}
              onSaved={(task) => {
                onTaskSaved(row.original.requestRecordId, task);
              }}
            />
          );
        },
      },
    ],
    [onTaskSaved, selectedIds, showDeveloper, taskOverrides, toggleRequest],
  );
  const table = useReactTable({
    data: requests,
    columns,
    getRowId: (row) => row.requestRecordId,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 25,
      },
    },
  });

  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto">
        <DataGrid table={table} emptyMessage="No captured requests" />
      </div>
      {requests.length > 25 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            Page {formatNumber(table.getState().pagination.pageIndex + 1)} of{" "}
            {formatNumber(table.getPageCount())}
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={!table.getCanPreviousPage()}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => {
                table.previousPage();
              }}
            >
              Previous
            </Button>
            <Button
              disabled={!table.getCanNextPage()}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => {
                table.nextPage();
              }}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SessionSelectionCheckbox({
  allSelected,
  someSelected,
  label,
  onChange,
}: {
  allSelected: boolean;
  someSelected: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <input
      ref={ref}
      aria-checked={someSelected ? "mixed" : allSelected}
      aria-label={label}
      checked={allSelected}
      className="mt-1 size-4"
      type="checkbox"
      onChange={(event) => {
        onChange(event.target.checked);
      }}
    />
  );
}

async function readMutationError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    // The generic message below is enough when the server sends no JSON body.
  }

  return "Could not update task assignments.";
}

async function readMutationResult(response: Response) {
  try {
    const payload = (await response.json()) as { updated?: unknown };
    return {
      updated: typeof payload.updated === "number" ? payload.updated : null,
    };
  } catch {
    return { updated: null };
  }
}

function groupRequestsBySession(
  requests: RequestGridRequest[],
  focusedSessionId: string | null,
): SessionGroup[] {
  const groups = new Map<string, SessionGroup>();
  for (const request of requests) {
    const group = groups.get(request.sessionId) ?? {
      sessionId: request.sessionId,
      sessionTitle: request.sessionTitle,
      sessionCreatedAt: request.sessionCreatedAt,
      requests: [],
    };
    group.requests.push(request);
    group.sessionTitle ??= request.sessionTitle;
    group.sessionCreatedAt ??= request.sessionCreatedAt;
    groups.set(request.sessionId, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      requests: [...group.requests].sort(
        (a, b) => getRequestActivityTimestamp(b) - getRequestActivityTimestamp(a),
      ),
    }))
    .sort((a, b) => {
      if (focusedSessionId) {
        if (a.sessionId === focusedSessionId) {
          return -1;
        }
        if (b.sessionId === focusedSessionId) {
          return 1;
        }
      }

      const aFirstRequest = a.requests[0];
      const bFirstRequest = b.requests[0];
      return (
        (bFirstRequest ? getRequestActivityTimestamp(bFirstRequest) : 0) -
        (aFirstRequest ? getRequestActivityTimestamp(aFirstRequest) : 0)
      );
    });
}

function getCommonTask(
  group: SessionGroup,
  taskOverrides: Record<string, string>,
) {
  const firstRequest = group.requests[0];
  if (!firstRequest) {
    return "";
  }

  const firstTask = getCurrentTask(firstRequest, taskOverrides);
  return group.requests.every(
    (request) => getCurrentTask(request, taskOverrides) === firstTask,
  )
    ? firstTask
    : "";
}

function getCurrentTask(
  request: RequestGridRequest,
  taskOverrides: Record<string, string>,
) {
  return (
    taskOverrides[request.requestRecordId] ??
    request.selectedTask ??
    request.defaultTask ??
    ""
  );
}

function formatRequestCost(request: RequestGridRequest) {
  if (request.totalTokens === null) {
    return "missing";
  }

  const cost = estimateRequestsCost([request]);
  if (cost.pricedRequestCount === 0) {
    return "unpriced";
  }

  return formatCurrency(cost.estimatedUsd);
}

function formatTokenCaptureLabel(request: RequestGridRequest) {
  if (request.totalTokens !== null) {
    return `${formatNumber(request.totalTokens)} total`;
  }

  return request.tokenSource === "partial-in-copilot-otel"
    ? "partial capture"
    : "missing total";
}

function sessionAnchor(sessionId: string) {
  return `session-${sessionId.replaceAll(/[^a-zA-Z0-9_-]/g, "-")}`;
}
