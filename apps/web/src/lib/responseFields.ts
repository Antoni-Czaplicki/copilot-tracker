export async function readNumericResponseField(
  response: Response,
  field: string,
) {
  try {
    const payload: unknown = await response.json();
    if (!isRecord(payload)) {
      return null;
    }

    const value = payload[field];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
