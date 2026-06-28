import * as vscode from "vscode";

import { logInfo, logWarn } from "./logger";

export async function getGitHubToken(): Promise<string | null> {
  try {
    logInfo("Requesting GitHub authentication session");
    const session = await vscode.authentication.getSession(
      "github",
      ["read:user"],
      { createIfNone: true },
    );
    logInfo("GitHub authentication session acquired", {
      accountLabel: session.account.label,
      scopes: session.scopes,
    });
    return session.accessToken;
  } catch (error) {
    console.warn(
      "Copilot Tracker could not acquire GitHub authentication session",
      error,
    );
    logWarn("Could not acquire GitHub authentication session", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
