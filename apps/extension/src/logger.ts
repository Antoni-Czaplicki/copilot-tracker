import * as vscode from "vscode";

let outputChannel: vscode.LogOutputChannel | undefined;

export function initializeLogger(): vscode.LogOutputChannel {
  outputChannel ??= vscode.window.createOutputChannel("Copilot Tracker", {
    log: true,
  });
  return outputChannel;
}

export function showLogs() {
  outputChannel?.show(true);
}

export function logInfo(message: string, details?: unknown) {
  writeLog("info", message, details);
}

export function logDebug(message: string, details?: unknown) {
  writeLog("debug", message, details);
}

export function logWarn(message: string, details?: unknown) {
  writeLog("warn", message, details);
}

export function logError(message: string, details?: unknown) {
  writeLog("error", message, details);
}

function writeLog(
  level: "debug" | "info" | "warn" | "error",
  message: string,
  details?: unknown,
) {
  if (!outputChannel) {
    return;
  }

  const formattedDetails =
    details === undefined ? undefined : formatDetails(details);
  if (details !== undefined) {
    outputChannel[level](`${message}\n${formattedDetails}`);
    return;
  }

  outputChannel[level](message);
}

function formatDetails(details: unknown): string {
  if (details instanceof Error) {
    return details.stack ?? details.message;
  }

  if (typeof details === "string") {
    return details;
  }

  try {
    return JSON.stringify(redact(details), null, 2);
  } catch {
    return String(details);
  }
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      isSensitiveKey(key, nestedValue) ? "[redacted]" : redact(nestedValue),
    ]),
  );
}

function isSensitiveKey(key: string, value: unknown): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, "");
  if (
    normalized.includes("authorization") ||
    normalized.includes("password") ||
    normalized.includes("secret")
  ) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  return normalized.endsWith("token");
}
