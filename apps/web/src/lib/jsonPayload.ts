interface JsonReadableRequest {
  json: () => Promise<unknown>;
}

export async function readJsonPayload(
  request: JsonReadableRequest,
): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function readJsonObjectPayload(request: {
  json: () => Promise<unknown>;
}): Promise<Record<string, unknown> | null> {
  const body = await readJsonPayload(request);
  return isRecord(body) ? body : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
