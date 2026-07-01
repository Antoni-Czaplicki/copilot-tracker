const allowedCallbackHosts = new Set(["antoni-czaplicki.copilot-tracker"]);
const allowedCallbackProtocols = new Set(["vscode:", "vscode-insiders:"]);
const statePattern = /^[A-Za-z0-9._~-]{1,128}$/u;

export function parseExtensionCallbackUrl(value: string | null): URL | null {
  if (!value) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!allowedCallbackProtocols.has(url.protocol)) {
    return null;
  }

  if (!allowedCallbackHosts.has(url.hostname)) {
    return null;
  }

  if (url.pathname !== "/auth" || url.search || url.hash) {
    return null;
  }

  return url;
}

export function parseExtensionAuthState(value: string | null): string | null {
  if (!value || !statePattern.test(value)) {
    return null;
  }

  return value;
}
