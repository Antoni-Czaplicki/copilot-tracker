"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";

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

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ githubLogin }),
    });
    setState(response.ok ? "saved" : "error");
  }

  return (
    <form className="flex min-w-[280px] items-center gap-2" onSubmit={submit}>
      <Input
        aria-label="GitHub username"
        className="max-w-[180px]"
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
