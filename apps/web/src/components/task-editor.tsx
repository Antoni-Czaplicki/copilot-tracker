"use client";

import { FormEvent, useState } from "react";

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

  async function submit(event: FormEvent) {
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
    <form className="task-editor" onSubmit={submit}>
      <Input value={task} onChange={(event) => setTask(event.target.value)} />
      <Button disabled={state === "saving"} type="submit" variant="secondary">
        {state === "saving" ? "Saving" : "Save"}
      </Button>
      {state === "saved" ? <span className="form-success">Saved</span> : null}
      {state === "error" ? <span className="form-error">Failed</span> : null}
    </form>
  );
}
