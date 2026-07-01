"use client";

import {
  BookOpen,
  Bug,
  CircleCheck,
  ClipboardList,
  ExternalLink,
  FileText,
  Flag,
  GitPullRequest,
  ListTodo,
  Search,
  TestTube,
  Wrench,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import type { WorkItemSearchItem } from "@/lib/workItemPicker";
import {
  canSearchWorkItems,
  isTerminalWorkItemState,
  nextWorkItemActiveIndex,
  safeWorkItemUrl,
  sortWorkItemSearchItems,
  workItemPickerStatusText,
  workItemsFromSearchPayload,
  workItemSearchErrorMessage,
} from "@/lib/workItemPicker";
import { cn } from "@/lib/utils";

import { AnchorButton } from "./ui/button";
import { Input } from "./ui/input";

interface WorkItemPickerProps {
  value: string;
  onChange: (value: string) => void;
  knownWorkItem?: WorkItemSearchItem | null;
  placeholder?: string;
}

export function WorkItemPicker({
  value,
  onChange,
  knownWorkItem = null,
  placeholder = "Search task id or title",
}: WorkItemPickerProps) {
  const inputId = useId();
  const listboxId = useId();
  const [workItems, setWorkItems] = useState<WorkItemSearchItem[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [resultQuery, setResultQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [editedSearch, setEditedSearch] = useState(false);
  const [dismissedValue, setDismissedValue] = useState<string | null>(null);
  const [selectedWorkItem, setSelectedWorkItem] =
    useState<WorkItemSearchItem | null>(null);
  const normalizedValue = value.trim();
  const canSearch = canSearchWorkItems(normalizedValue);
  const searchActive =
    focused && editedSearch && canSearch && dismissedValue !== normalizedValue;
  const resultMatchesQuery = searchActive && resultQuery === normalizedValue;
  const visibleWorkItems = resultMatchesQuery
    ? sortWorkItemSearchItems(workItems)
    : [];
  const visibleState = searchActive
    ? resultMatchesQuery
      ? state
      : "loading"
    : "idle";
  const expanded = visibleWorkItems.length > 0;

  useEffect(() => {
    if (!searchActive) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      const params = new URLSearchParams({ query: normalizedValue });
      fetch(`/api/azure-devops/work-items?${params.toString()}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(await workItemSearchErrorMessage(response));
          }
          return workItemsFromSearchPayload(await response.json());
        })
        .then((items) => {
          setResultQuery(normalizedValue);
          setWorkItems(items);
          setActiveIndex(0);
          setErrorMessage(null);
          setState("idle");
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setResultQuery(normalizedValue);
          setWorkItems([]);
          setErrorMessage(
            error instanceof Error ? error.message : "Search failed",
          );
          setState("error");
        });
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [normalizedValue, searchActive]);

  const selectedWorkItemForValue =
    selectedWorkItem && String(selectedWorkItem.id) === normalizedValue
      ? selectedWorkItem
      : knownWorkItem && String(knownWorkItem.id) === normalizedValue
        ? knownWorkItem
      : resultMatchesQuery
        ? workItems.find((item) => String(item.id) === normalizedValue) ?? null
        : null;
  const selectedWorkItemUrl = safeWorkItemUrl(
    selectedWorkItemForValue?.url ?? null,
  );

  const statusText = useMemo(() => {
    return workItemPickerStatusText({
      canSearch,
      errorMessage,
      query: normalizedValue,
      resultMatchesQuery,
      searchActive,
      visibleState,
      visibleWorkItemCount: visibleWorkItems.length,
    });
  }, [
    canSearch,
    errorMessage,
    normalizedValue,
    resultMatchesQuery,
    searchActive,
    visibleState,
    visibleWorkItems.length,
  ]);

  function selectWorkItem(item: WorkItemSearchItem) {
    onChange(String(item.id));
    setSelectedWorkItem(item);
    setDismissedValue(String(item.id));
    setEditedSearch(false);
    setWorkItems([]);
    setResultQuery("");
    setActiveIndex(0);
    setState("idle");
  }

  return (
    <div
      className="grid w-full min-w-0 gap-1.5 sm:min-w-[260px]"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
          setWorkItems([]);
        }
      }}
      onFocus={() => {
        setFocused(true);
      }}
    >
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-2 left-2 size-3.5" />
        <Input
          aria-activedescendant={
            expanded
              ? `${listboxId}-${visibleWorkItems[activeIndex]?.id}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={expanded}
          aria-haspopup="listbox"
          className={cn("pl-7", selectedWorkItemUrl && "pr-8")}
          id={inputId}
          placeholder={placeholder}
          role="combobox"
          value={value}
          onKeyDown={(event) => {
            if (!expanded) {
              return;
            }

            switch (event.key) {
              case "ArrowDown": {
                event.preventDefault();
                setActiveIndex((index) =>
                  nextWorkItemActiveIndex({
                    currentIndex: index,
                    itemCount: visibleWorkItems.length,
                    key: "ArrowDown",
                  }),
                );
                break;
              }
              case "ArrowUp": {
                event.preventDefault();
                setActiveIndex((index) =>
                  nextWorkItemActiveIndex({
                    currentIndex: index,
                    itemCount: visibleWorkItems.length,
                    key: "ArrowUp",
                  }),
                );
                break;
              }
              case "Enter": {
                event.preventDefault();
                const selected = visibleWorkItems[activeIndex];
                if (selected) {
                  selectWorkItem(selected);
                }
                break;
              }
              case "Escape": {
                setWorkItems([]);
                break;
              }
            }
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDismissedValue(null);
            setSelectedWorkItem(null);
            setEditedSearch(true);
            onChange(nextValue);
          }}
        />
        {selectedWorkItemUrl ? (
          <AnchorButton
            aria-label={`Open Azure DevOps work item ${selectedWorkItemForValue?.id}`}
            className="absolute top-1 right-1"
            href={selectedWorkItemUrl}
            rel="noreferrer"
            size="icon-xs"
            target="_blank"
            title={`Open work item ${selectedWorkItemForValue?.id} in Azure DevOps`}
            variant="ghost"
          >
            <ExternalLink aria-hidden="true" />
          </AnchorButton>
        ) : null}
      </div>
      {statusText ? (
        <div
          aria-live="polite"
          className="text-muted-foreground text-[11px]"
          role="status"
        >
          {statusText}
        </div>
      ) : selectedWorkItemForValue ? (
        <WorkItemSummary item={selectedWorkItemForValue} />
      ) : null}
      {visibleWorkItems.length > 0 ? (
        <div
          aria-labelledby={inputId}
          className="border-border bg-background max-h-72 overflow-auto border shadow-sm"
          id={listboxId}
          role="listbox"
        >
          {visibleWorkItems.map((item, index) => {
            const openUrl = safeWorkItemUrl(item.url);
            const terminal = isTerminalWorkItemState(item.state);
            const TypeIcon = workItemTypeIcon(item.type);
            return (
              <div
                key={item.id}
                aria-selected={index === activeIndex}
                className={cn(
                  "grid grid-cols-[1fr_auto] items-stretch gap-1 border-b last:border-b-0",
                  index === activeIndex && "bg-secondary",
                  terminal && "text-muted-foreground",
                )}
                id={`${listboxId}-${item.id}`}
                role="option"
                tabIndex={-1}
                onMouseEnter={() => {
                  setActiveIndex(index);
                }}
              >
                <button
                  className="flex min-w-0 items-start gap-2 px-2 py-1.5 text-left"
                  type="button"
                  onClick={() => {
                    selectWorkItem(item);
                  }}
                >
                  <TypeIcon
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      terminal ? "text-muted-foreground" : "text-primary",
                    )}
                  />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="break-words text-xs leading-snug">
                      <strong className="text-foreground">{item.id}</strong>{" "}
                      {item.title}
                    </span>
                    <span className="text-muted-foreground flex flex-wrap gap-x-1.5 gap-y-0.5 text-[11px]">
                      {workItemMetadata(item).map((detail) => (
                        <span key={detail}>{detail}</span>
                      ))}
                    </span>
                  </span>
                </button>
                {openUrl ? (
                  <AnchorButton
                    aria-label={`Open Azure DevOps work item ${item.id}`}
                    className="m-1 self-start"
                    href={openUrl}
                    rel="noreferrer"
                    size="icon-xs"
                    target="_blank"
                    title={`Open work item ${item.id} in Azure DevOps`}
                    variant="ghost"
                  >
                    <ExternalLink aria-hidden="true" />
                  </AnchorButton>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function WorkItemSummary({ item }: { item: WorkItemSearchItem }) {
  const TypeIcon = workItemTypeIcon(item.type);
  return (
    <div className="text-muted-foreground flex min-w-0 items-start gap-1.5 text-[11px]">
      <TypeIcon aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
      <span className="min-w-0 truncate">
        {item.title}
        {item.state ? ` · ${item.state}` : ""}
      </span>
    </div>
  );
}

function workItemMetadata(item: WorkItemSearchItem) {
  return [
    item.type,
    item.state,
    item.project,
    item.assignedTo ? `Assigned to ${item.assignedTo}` : null,
    item.tags ? `Tags: ${item.tags}` : null,
  ].filter(Boolean);
}

function workItemTypeIcon(type: string | null) {
  const normalizedType = type?.trim().toLowerCase() ?? "";
  if (normalizedType.includes("bug")) {
    return Bug;
  }
  if (normalizedType.includes("user story") || normalizedType === "story") {
    return BookOpen;
  }
  if (normalizedType.includes("feature")) {
    return Flag;
  }
  if (normalizedType.includes("task")) {
    return ListTodo;
  }
  if (normalizedType.includes("test")) {
    return TestTube;
  }
  if (normalizedType.includes("pull request")) {
    return GitPullRequest;
  }
  if (normalizedType.includes("issue")) {
    return CircleCheck;
  }
  if (normalizedType.includes("change") || normalizedType.includes("chore")) {
    return Wrench;
  }
  if (normalizedType.includes("document")) {
    return FileText;
  }

  return ClipboardList;
}
