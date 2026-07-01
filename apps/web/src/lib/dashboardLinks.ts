export function dashboardTaskPageHref(
  basePath: string,
  page: number,
  focusedSessionId: string | null,
) {
  const params = new URLSearchParams();
  params.set("taskPage", String(page));
  if (focusedSessionId) {
    params.set("sessionId", focusedSessionId);
  }
  return `${basePath}?${params.toString()}`;
}
