export async function readResponseError(response: Response) {
  try {
    const payload: unknown = await response.json();
    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      "error" in payload
    ) {
      const error = (payload as { error?: unknown }).error;
      if (typeof error === "string" && error.trim()) {
        return error.trim();
      }
    }
  } catch {
    // Keep the caller-provided fallback for non-JSON or empty responses.
  }

  return null;
}

export async function responseErrorMessage(
  response: Response,
  fallback: string,
) {
  return (await readResponseError(response)) ?? fallback;
}
