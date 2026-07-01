"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";

import { Button } from "./ui/button";
import { WorkItemPicker } from "./work-item-picker";

interface TaskEditorProps {
  requestRecordId: string;
  initialTask: string;
  onSaved?: (task: string) => void;
}

export function TaskEditor({
  requestRecordId,
  initialTask,
  onSaved,
}: TaskEditorProps) {
  const [task, setTask] = useState(initialTask);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedTask = task.trim();
    if (!selectedTask) {
      setError("Choose a task.");
      setState("error");
      return;
    }

    setState("saving");
    setError(null);
    try {
      const response = await fetch(
        `/api/chat-requests/${encodeURIComponent(requestRecordId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ selectedTask }),
        },
      );
      if (!response.ok) {
        setError(await readTaskMutationError(response));
        setState("error");
        return;
      }

      setTask(selectedTask);
      setState("saved");
      onSaved?.(selectedTask);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Could not update task.",
      );
      setState("error");
    }
  }

  return (
    <form className="grid min-w-[280px] gap-1.5" onSubmit={submit}>
      <div className="flex items-start gap-2">
        <WorkItemPicker
          value={task}
          onChange={(value) => {
            setTask(value);
            setState("idle");
            setError(null);
          }}
        />
        <Button
          disabled={state === "saving"}
          size="sm"
          type="submit"
          variant="secondary"
        >
          {state === "saving" ? "Saving" : "Save"}
        </Button>
      </div>
      {state === "saved" ? (
        <span className="text-xs font-bold text-[oklch(0.527_0.154_150.069)]">
          Saved
        </span>
      ) : null}
      {state === "error" ? (
        <span className="text-destructive text-xs font-bold">
          {error ?? "Failed"}
        </span>
      ) : null}
    </form>
  );
}

async function readTaskMutationError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    // Keep the fallback below when the server does not return JSON.
  }

  return "Could not update task.";
}
