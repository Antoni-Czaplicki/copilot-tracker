export const healthCacheHeaders = {
  "cache-control": "no-store, no-cache, max-age=0, must-revalidate",
  "cdn-cache-control": "no-store",
  expires: "0",
  pragma: "no-cache",
  "surrogate-control": "no-store",
} as const;

export function healthResponseInit(ok: boolean): ResponseInit {
  return {
    headers: healthCacheHeaders,
    status: ok ? 200 : 503,
  };
}
