"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AzureDevOpsWorkItem {
  id: number;
  title: string;
  state: string | null;
  type: string | null;
  project: string | null;
  assignedTo: string | null;
  changedAt: string | null;
  url: string | null;
}

interface WorkItemPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function WorkItemPicker({
  value,
  onChange,
  placeholder = "Search task id or title",
}: WorkItemPickerProps) {
  const inputId = useId();
  const listboxId = useId();
  const [workItems, setWorkItems] = useState<AzureDevOpsWorkItem[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const normalizedValue = value.trim();
  const canSearch = normalizedValue.length >= 2 || /^\d+$/u.test(normalizedValue);
  const visibleWorkItems = canSearch ? workItems : [];
  const visibleState = canSearch ? state : "idle";
  const expanded = visibleWorkItems.length > 0;

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setState("loading");
      const params = new URLSearchParams({ query: normalizedValue });
      fetch(`/api/azure-devops/work-items?${params.toString()}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(await workItemSearchErrorMessage(response));
          }
          return (await response.json()) as {
            workItems?: AzureDevOpsWorkItem[];
          };
        })
        .then((payload) => {
          setWorkItems(payload.workItems ?? []);
          setActiveIndex(0);
          setErrorMessage(null);
          setState("idle");
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
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
  }, [canSearch, normalizedValue]);

  const statusText = useMemo(() => {
    if (visibleState === "loading") {
      return "Searching";
    }

    if (visibleState === "error") {
      return errorMessage ?? "Search failed";
    }

    if (visibleWorkItems.length === 0 && canSearch) {
      return "No matches";
    }

    return null;
  }, [canSearch, errorMessage, visibleState, visibleWorkItems.length]);

  function selectWorkItem(item: AzureDevOpsWorkItem) {
    onChange(String(item.id));
    setWorkItems([]);
    setActiveIndex(0);
  }

  return (
    <div className="grid w-full min-w-0 gap-1.5 sm:min-w-[260px]">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-2 left-2 size-3.5" />
        <Input
          aria-activedescendant={
            expanded ? `${listboxId}-${visibleWorkItems[activeIndex]?.id}` : undefined
          }
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={expanded}
          aria-haspopup="listbox"
          className="pl-7"
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
                  Math.min(index + 1, visibleWorkItems.length - 1),
                );
                break;
              }
              case "ArrowUp": {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
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
            onChange(nextValue);
          }}
        />
      </div>
      {statusText ? (
        <div
          aria-live="polite"
          className="text-muted-foreground text-[11px]"
          role="status"
        >
          {statusText}
        </div>
      ) : null}
      {visibleWorkItems.length > 0 ? (
        <div
          aria-labelledby={inputId}
          className="border-border bg-background max-h-48 overflow-auto border"
          id={listboxId}
          role="listbox"
        >
          {visibleWorkItems.map((item, index) => (
            <Button
              key={item.id}
              aria-selected={index === activeIndex}
              className="h-auto w-full justify-start whitespace-normal px-2 py-1.5 text-left"
              id={`${listboxId}-${item.id}`}
              role="option"
              type="button"
              variant={index === activeIndex ? "secondary" : "ghost"}
              onClick={() => {
                selectWorkItem(item);
              }}
            >
              <span className="grid gap-0.5">
                <span>
                  <strong>{item.id}</strong> {item.title}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {[item.type, item.state, item.project]
                    .filter(Boolean)
                    .join(" / ")}
                </span>
              </span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

async function workItemSearchErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (payload.error === "azure_devops_forbidden") {
      return "Azure DevOps work-item access is missing.";
    }
    if (payload.error === "azure_devops_unauthorized") {
      return "Sign in to Azure DevOps again.";
    }
    if (payload.error === "azure_devops_rate_limited") {
      return "Azure DevOps rate limit reached.";
    }
  } catch {
    // Fall through to status-based messages.
  }

  return `Search failed (${response.status})`;
}
