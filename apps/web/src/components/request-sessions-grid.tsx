"use client";

import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import type {
  RequestGridRequest,
  SessionGroup,
  TaskOverrideMap,
} from "@/lib/requestSessionsGridModel";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  ListFilter,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatDateTime,
  formatNumber,
  getRequestActivityTimestamp,
  getRepositoryName,
  summarizeRequests,
} from "@/lib/analytics";
import {
  formatRequestCost,
  formatTokenCaptureLabel,
  getCommonTask,
  getCurrentTask,
  groupRequestsBySession,
  sessionAnchor,
} from "@/lib/requestSessionsGridModel";
import { estimateRequestsCost, formatCurrency } from "@/lib/pricing";
import { responseErrorMessage } from "@/lib/responseErrors";
import { readNumericResponseField } from "@/lib/responseFields";
import { cn } from "@/lib/utils";
import type { WorkItemSearchItem } from "@/lib/workItemPicker";
import {
  safeWorkItemUrl,
  workItemsFromSearchPayload,
} from "@/lib/workItemPicker";

import { Badge } from "./ui/badge";
import { AnchorButton, Button } from "./ui/button";
import { DataGrid } from "./ui/data-grid";
import { Input } from "./ui/input";
import { TaskEditor } from "./task-editor";
import { WorkItemPicker } from "./work-item-picker";

interface RequestSessionsGridProps {
  requests: RequestGridRequest[];
  focusedSessionId?: string | null;
  showDeveloper?: boolean;
}

export function RequestSessionsGrid({
  requests,
  focusedSessionId = null,
  showDeveloper = false,
}: RequestSessionsGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [taskOverrides, setTaskOverrides] = useState<TaskOverrideMap>({});
  const [sessionDrafts, setSessionDrafts] = useState<Record<string, string>>(
    {},
  );
  const [bulkTask, setBulkTask] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(
    () => new Set(focusedSessionId ? [focusedSessionId] : []),
  );
  const [sessionSorting, setSessionSorting] = useState<SortingState>([
    { id: "activity", desc: true },
  ]);
  const [sessionFilter, setSessionFilter] = useState("");
  const [sessionPagination, setSessionPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [workItemCache, setWorkItemCache] = useState<
    Record<number, WorkItemSearchItem | null>
  >({});

  const groups = useMemo(
    () => groupRequestsBySession(requests, focusedSessionId),
    [focusedSessionId, requests],
  );
  const sessionColumns = useMemo<ColumnDef<SessionGroup>[]>(
    () => [
      {
        id: "activity",
        accessorFn: (group) => latestSessionActivity(group),
      },
      {
        id: "title",
        accessorFn: (group) => group.sessionTitle ?? group.sessionId,
      },
      {
        id: "task",
        accessorFn: (group) =>
          getSessionTaskLabel(group, taskOverrides, sessionDrafts),
      },
      {
        id: "requests",
        accessorFn: (group) => group.requests.length,
      },
      {
        id: "tokens",
        accessorFn: (group) => summarizeRequests(group.requests).totalTokens,
      },
    ],
    [sessionDrafts, taskOverrides],
  );
  const sessionTable = useReactTable({
    data: groups,
    columns: sessionColumns,
    state: {
      globalFilter: sessionFilter,
      pagination: sessionPagination,
      sorting: sessionSorting,
    },
    onGlobalFilterChange: setSessionFilter,
    onPaginationChange: setSessionPagination,
    onSortingChange: setSessionSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      sessionGroupSearchText(row.original, taskOverrides, sessionDrafts)
        .toLowerCase()
        .includes(String(filterValue).trim().toLowerCase()),
  });
  const visibleGroups = sessionTable
    .getRowModel()
    .rows.map((row) => row.original);
  const selectedRequests = useMemo(
    () =>
      requests.filter((request) => selectedIds.has(request.requestRecordId)),
    [requests, selectedIds],
  );
  const selectedSaving =
    savingKey === "selected" || savingKey === "clear-selected";
  const visibleTaskIds = useMemo(
    () => uniqueTaskIds(visibleGroups, taskOverrides, sessionDrafts),
    [sessionDrafts, taskOverrides, visibleGroups],
  );

  useEffect(() => {
    const missingIds = visibleTaskIds.filter(
      (id) => !Object.hasOwn(workItemCache, id),
    );
    if (missingIds.length === 0) {
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ ids: missingIds.join(",") });
    fetch(`/api/azure-devops/work-items?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load task details.");
        }
        return workItemsFromSearchPayload(await response.json());
      })
      .then((items) => {
        const itemsById = new Map(items.map((item) => [item.id, item]));
        setWorkItemCache((current) => ({
          ...current,
          ...Object.fromEntries(
            missingIds.map((id) => [id, itemsById.get(id) ?? null]),
          ),
        }));
      })
      .catch((taskInfoError: unknown) => {
        if (
          taskInfoError instanceof DOMException &&
          taskInfoError.name === "AbortError"
        ) {
          return;
        }
        setWorkItemCache((current) => ({
          ...current,
          ...Object.fromEntries(missingIds.map((id) => [id, null])),
        }));
      });

    return () => {
      controller.abort();
    };
  }, [visibleTaskIds, workItemCache]);

  function workItemForTask(task: string) {
    const id = numericTaskId(task);
    return id === null ? null : (workItemCache[id] ?? null);
  }

  async function applyTask({
    requestRecordIds,
    sessionId,
    selectedTask,
    key,
  }: {
    requestRecordIds?: string[];
    sessionId?: string;
    selectedTask: string | null;
    key: string;
  }) {
    const task = selectedTask === null ? null : selectedTask.trim();
    if (task === "") {
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
      if (sessionId && task === null) {
        setSessionDrafts(({ [sessionId]: _removed, ...remaining }) => remaining);
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

  function handleSingleTaskSaved(
    requestRecordId: string,
    selectedTask: string | null,
  ) {
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
              disabled={selectedSaving}
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
            <Button
              disabled={selectedSaving}
              type="button"
              variant="outline"
              onClick={() => {
                void applyTask({
                  requestRecordIds: [...selectedIds],
                  selectedTask: null,
                  key: "clear-selected",
                });
              }}
            >
              {savingKey === "clear-selected" ? "Clearing" : "Clear selected"}
            </Button>
          </div>
        </section>
      ) : null}

      {error ? (
        <p aria-live="polite" className="text-destructive text-sm" role="status">
          {error}
        </p>
      ) : null}

      <section className="border-border bg-muted/20 grid gap-3 border p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 lg:max-w-sm lg:flex-1">
            <Filter className="text-muted-foreground pointer-events-none absolute top-2 left-2 size-3.5" />
            <Input
              className="pl-7"
              placeholder="Filter sessions, repos, branches, tasks"
              value={sessionFilter}
              onChange={(event) => {
                setSessionFilter(event.target.value);
                sessionTable.setPageIndex(0);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-muted-foreground flex items-center gap-1 text-xs">
              <ListFilter aria-hidden="true" className="size-3.5" />
              <select
                className="border-input bg-background h-8 rounded-none border px-2 text-xs"
                value={sessionSortValue(sessionSorting)}
                onChange={(event) => {
                  setSessionSorting(sortValueToSorting(event.target.value));
                }}
              >
                <option value="activity:desc">Newest activity</option>
                <option value="activity:asc">Oldest activity</option>
                <option value="requests:desc">Most requests</option>
                <option value="tokens:desc">Most tokens</option>
                <option value="title:asc">Session title</option>
                <option value="task:asc">Task</option>
              </select>
            </label>
            <select
              aria-label="Sessions per page"
              className="border-input bg-background h-8 rounded-none border px-2 text-xs"
              value={sessionPagination.pageSize}
              onChange={(event) => {
                sessionTable.setPageSize(Number(event.target.value));
              }}
            >
              <option value="5">5 / page</option>
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => {
                setExpandedSessionIds(
                  new Set(visibleGroups.map((group) => group.sessionId)),
                );
              }}
            >
              Expand page
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => {
                setExpandedSessionIds(new Set());
              }}
            >
              Collapse all
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Showing {formatNumber(visibleGroups.length)} of{" "}
          {formatNumber(sessionTable.getFilteredRowModel().rows.length)} matching
          sessions.
        </p>
      </section>

      {visibleGroups.map((group) => {
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
        const sessionSaving =
          savingKey === sessionKey || savingKey === `${sessionKey}:clear`;
        const expanded = expandedSessionIds.has(group.sessionId);
        const sessionTaskInfo = sessionTask ? workItemForTask(sessionTask) : null;

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
                <Button
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "Collapse" : "Expand"} ${
                    group.sessionTitle ?? group.sessionId
                  }`}
                  className="mt-0.5"
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setExpandedSessionIds((current) => {
                      const next = new Set(current);
                      if (next.has(group.sessionId)) {
                        next.delete(group.sessionId);
                      } else {
                        next.add(group.sessionId);
                      }
                      return next;
                    });
                  }}
                >
                  {expanded ? (
                    <ChevronDown aria-hidden="true" />
                  ) : (
                    <ChevronRight aria-hidden="true" />
                  )}
                </Button>
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
                  <SessionTaskSummary
                    item={sessionTaskInfo}
                    task={sessionTask}
                    variant={sessionTaskLabel(group, taskOverrides, sessionDrafts)}
                  />
                </div>
              </div>

              {expanded ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <WorkItemPicker
                    knownWorkItem={sessionTaskInfo}
                    value={sessionTask}
                    onChange={(value) => {
                      setSessionDrafts((current) => ({
                        ...current,
                        [group.sessionId]: value,
                      }));
                    }}
                  />
                  <Button
                    disabled={sessionSaving}
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
                  <Button
                    disabled={sessionSaving}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void applyTask({
                        sessionId: group.sessionId,
                        selectedTask: null,
                        key: `${sessionKey}:clear`,
                      });
                    }}
                  >
                    {savingKey === `${sessionKey}:clear`
                      ? "Clearing"
                      : "Clear session"}
                  </Button>
                </div>
              ) : null}
            </div>

            {expanded ? (
              <SessionRequestTable
                requests={group.requests}
                selectedIds={selectedIds}
                showDeveloper={showDeveloper}
                taskOverrides={taskOverrides}
                toggleRequest={toggleRequest}
                workItemForTask={workItemForTask}
                onTaskSaved={handleSingleTaskSaved}
              />
            ) : null}
          </section>
        );
      })}

      {sessionTable.getPageCount() > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            Page{" "}
            {formatNumber(sessionTable.getState().pagination.pageIndex + 1)} of{" "}
            {formatNumber(sessionTable.getPageCount())}
          </p>
          <div className="flex items-center gap-2">
            <Button
              disabled={!sessionTable.getCanPreviousPage()}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => {
                sessionTable.previousPage();
              }}
            >
              Previous
            </Button>
            <Button
              disabled={!sessionTable.getCanNextPage()}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => {
                sessionTable.nextPage();
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

function SessionTaskSummary({
  item,
  task,
  variant,
}: {
  item: WorkItemSearchItem | null;
  task: string;
  variant: "empty" | "mixed" | "task";
}) {
  if (variant === "mixed") {
    return (
      <p className="text-muted-foreground mt-1 text-xs">Task: mixed values</p>
    );
  }

  if (variant === "empty") {
    return <p className="text-muted-foreground mt-1 text-xs">Task: none</p>;
  }

  const url = safeWorkItemUrl(item?.url ?? null);
  return (
    <div className="text-muted-foreground mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
      <span className="font-medium text-foreground">Task {task}</span>
      {item ? (
        <>
          <span className="min-w-0 truncate">{item.title}</span>
          {item.state ? <Badge variant="outline">{item.state}</Badge> : null}
          {url ? (
            <AnchorButton
              aria-label={`Open Azure DevOps work item ${item.id}`}
              href={url}
              rel="noreferrer"
              size="icon-xs"
              target="_blank"
              title={`Open work item ${item.id} in Azure DevOps`}
              variant="ghost"
            >
              <ExternalLink aria-hidden="true" />
            </AnchorButton>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function SessionRequestTable({
  requests,
  selectedIds,
  showDeveloper,
  taskOverrides,
  toggleRequest,
  workItemForTask,
  onTaskSaved,
}: {
  requests: RequestGridRequest[];
  selectedIds: Set<string>;
  showDeveloper: boolean;
  taskOverrides: TaskOverrideMap;
  toggleRequest: (requestRecordId: string, checked: boolean) => void;
  workItemForTask: (task: string) => WorkItemSearchItem | null;
  onTaskSaved: (requestRecordId: string, selectedTask: string | null) => void;
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
              knownWorkItem={workItemForTask(currentTask)}
              requestRecordId={row.original.requestRecordId}
              onSaved={(task) => {
                onTaskSaved(row.original.requestRecordId, task);
              }}
            />
          );
        },
      },
    ],
    [
      onTaskSaved,
      selectedIds,
      showDeveloper,
      taskOverrides,
      toggleRequest,
      workItemForTask,
    ],
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
  return responseErrorMessage(response, "Could not update task assignments.");
}

async function readMutationResult(response: Response) {
  return {
    updated: await readNumericResponseField(response, "updated"),
  };
}

function latestSessionActivity(group: SessionGroup) {
  const firstRequest = group.requests[0];
  return firstRequest ? getRequestActivityTimestamp(firstRequest) : 0;
}

function sessionTaskLabel(
  group: SessionGroup,
  taskOverrides: TaskOverrideMap,
  sessionDrafts: Record<string, string>,
): "empty" | "mixed" | "task" {
  const draft = sessionDrafts[group.sessionId];
  if (draft !== undefined) {
    return draft.trim() ? "task" : "empty";
  }

  const tasks = new Set(
    group.requests.map((request) => getCurrentTask(request, taskOverrides)),
  );
  if (tasks.size > 1) {
    return "mixed";
  }

  return [...tasks][0]?.trim() ? "task" : "empty";
}

function getSessionTaskLabel(
  group: SessionGroup,
  taskOverrides: TaskOverrideMap,
  sessionDrafts: Record<string, string>,
) {
  const label = sessionTaskLabel(group, taskOverrides, sessionDrafts);
  if (label === "mixed") {
    return "mixed";
  }
  if (label === "empty") {
    return "";
  }

  return sessionDrafts[group.sessionId] ?? getCommonTask(group, taskOverrides);
}

function sessionGroupSearchText(
  group: SessionGroup,
  taskOverrides: TaskOverrideMap,
  sessionDrafts: Record<string, string>,
) {
  return [
    group.sessionId,
    group.sessionTitle,
    getSessionTaskLabel(group, taskOverrides, sessionDrafts),
    ...group.requests.flatMap((request) => [
      request.branch,
      getRepositoryName(request),
      request.repositoryRoot,
      request.modelId,
      request.modelName,
      request.resolvedModel,
      request.userLogin,
      request.githubLogin,
      getCurrentTask(request, taskOverrides),
    ]),
  ]
    .filter(Boolean)
    .join(" ");
}

function uniqueTaskIds(
  groups: SessionGroup[],
  taskOverrides: TaskOverrideMap,
  sessionDrafts: Record<string, string>,
) {
  return [
    ...new Set(
      groups.flatMap((group) => [
        numericTaskId(
          sessionDrafts[group.sessionId] ?? getCommonTask(group, taskOverrides),
        ),
        ...group.requests.map((request) =>
          numericTaskId(getCurrentTask(request, taskOverrides)),
        ),
      ]),
    ),
  ].filter((id): id is number => id !== null);
}

function numericTaskId(task: string) {
  const trimmed = task.trim();
  if (!/^\d+$/u.test(trimmed)) {
    return null;
  }

  const id = Number(trimmed);
  return Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647
    ? id
    : null;
}

function sessionSortValue(sorting: SortingState) {
  const sort = sorting[0];
  if (!sort) {
    return "activity:desc";
  }

  return `${sort.id}:${sort.desc ? "desc" : "asc"}`;
}

function sortValueToSorting(value: string): SortingState {
  const [id, direction] = value.split(":");
  if (
    id !== "activity" &&
    id !== "requests" &&
    id !== "task" &&
    id !== "title" &&
    id !== "tokens"
  ) {
    return [{ id: "activity", desc: true }];
  }

  return [{ id, desc: direction !== "asc" }];
}
