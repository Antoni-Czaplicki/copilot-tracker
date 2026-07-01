export function normalizeGithubLogin(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const login = value.trim().replace(/^@/, "");
  if (login.length === 0) {
    return null;
  }

  if (
    login.length > 39 ||
    login.startsWith("-") ||
    login.endsWith("-") ||
    !/^[A-Za-z0-9-]+$/.test(login)
  ) {
    throw new Error("Invalid GitHub username.");
  }

  return login;
}

export async function githubLoginMutationErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Fall through to the generic message for non-JSON or empty bodies.
  }

  return "Failed to save GitHub username.";
}
