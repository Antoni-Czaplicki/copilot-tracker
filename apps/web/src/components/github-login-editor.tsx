"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";

import { githubLoginMutationErrorMessage } from "@/lib/githubLogin";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface GithubLoginEditorProps {
  endpoint: string;
  initialGithubLogin: string | null;
}

export function GithubLoginEditor({
  endpoint,
  initialGithubLogin,
}: GithubLoginEditorProps) {
  const [githubLogin, setGithubLogin] = useState(initialGithubLogin ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ githubLogin }),
      });
      if (!response.ok) {
        setMessage(await githubLoginMutationErrorMessage(response));
        setState("error");
        return;
      }

      setState("saved");
    } catch {
      setMessage("Failed to save GitHub username.");
      setState("error");
    }
  }

  return (
    <form
      className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
      onSubmit={submit}
    >
      <Input
        aria-label="GitHub username"
        className="w-full sm:max-w-[180px]"
        placeholder="github-username"
        value={githubLogin}
        onChange={(event) => {
          setGithubLogin(event.target.value);
        }}
      />
      <Button disabled={state === "saving"} type="submit" variant="secondary">
        {state === "saving" ? "Saving" : "Save"}
      </Button>
      {state === "saved" ? (
        <span
          aria-live="polite"
          className="text-xs font-bold text-[oklch(0.527_0.154_150.069)]"
          role="status"
        >
          Saved
        </span>
      ) : null}
      {state === "error" ? (
        <span
          aria-live="polite"
          className="text-destructive text-xs font-bold"
          role="status"
        >
          {message ?? "Failed to save GitHub username."}
        </span>
      ) : null}
    </form>
  );
}
