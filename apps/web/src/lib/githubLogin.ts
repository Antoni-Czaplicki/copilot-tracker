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
