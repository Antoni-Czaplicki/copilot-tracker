import { parseTrackerServerUrl } from "./trackerClient";

export function trackerDashboardUrl(serverUrl: string, sessionId?: string) {
  const url = new URL("/dashboard", parseTrackerServerUrl(serverUrl));
  if (sessionId) {
    url.searchParams.set("sessionId", sessionId);
  }

  return url;
}
