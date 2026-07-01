export function healthResponseInit(ok: boolean): ResponseInit {
  return {
    headers: {
      "cache-control": "no-store",
    },
    status: ok ? 200 : 503,
  };
}
