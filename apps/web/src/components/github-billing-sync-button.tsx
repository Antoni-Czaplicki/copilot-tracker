"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "./ui/button";

export function GithubBillingSyncButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "syncing" | "synced" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function syncNow() {
    setState("syncing");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/github-billing/sync", {
        method: "POST",
      });
      if (!response.ok) {
        setMessage(await syncErrorMessage(response));
        setState("error");
        return;
      }

      const payload = (await response.json()) as { synced?: unknown };
      const synced = typeof payload.synced === "number" ? payload.synced : null;
      setMessage(
        synced === null
          ? "Billing usage synced."
          : `Billing usage synced: ${synced.toLocaleString()} rows.`,
      );
      setState("synced");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed.");
      setState("error");
    }
  }

  return (
    <div className="grid gap-1.5">
      <Button
        disabled={state === "syncing"}
        type="button"
        variant="secondary"
        onClick={() => {
          void syncNow();
        }}
      >
        <RefreshCw aria-hidden="true" data-icon="inline-start" />
        {state === "syncing" ? "Syncing" : "Sync now"}
      </Button>
      {message ? (
        <p
          className={
            state === "error"
              ? "text-destructive text-xs"
              : "text-muted-foreground text-xs"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

async function syncErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    // Fall back to the generic message below when the response is not JSON.
  }

  return "Sync failed.";
}

