"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TaskEditorProps {
  requestRecordId: string;
  initialTask: string;
}

export function TaskEditor({ requestRecordId, initialTask }: TaskEditorProps) {
  const [task, setTask] = useState(initialTask);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    const response = await fetch(
      `/api/chat-requests/${encodeURIComponent(requestRecordId)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedTask: task }),
      },
    );
    setState(response.ok ? "saved" : "error");
  }

  return (
    <form className="flex min-w-[260px] items-center gap-2" onSubmit={submit}>
      <Input
        className="max-w-[180px]"
        value={task}
        onChange={(event) => {
          setTask(event.target.value);
        }}
      />
      <Button disabled={state === "saving"} type="submit" variant="secondary">
        {state === "saving" ? "Saving" : "Save"}
      </Button>
      {state === "saved" ? (
        <span className="text-xs font-bold text-[oklch(0.527_0.154_150.069)]">
          Saved
        </span>
      ) : null}
      {state === "error" ? (
        <span className="text-destructive text-xs font-bold">Failed</span>
      ) : null}
    </form>
  );
}
