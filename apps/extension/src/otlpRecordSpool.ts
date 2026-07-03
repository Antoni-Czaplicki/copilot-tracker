import { appendFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import * as path from "node:path";

export interface SpooledOtlpRecord {
  receivedAt: string;
  signal: string;
  record: unknown;
}

export interface OtlpSpoolStat {
  sizeBytes: number;
  modifiedAtMs: number;
}

const spoolFileName = "otlp-records.jsonl";
const defaultMaxSpoolBytes = 20 * 1024 * 1024;
const defaultCompactKeepRecords = 2_500;

export function otlpSpoolPath(globalStoragePath: string) {
  return path.join(globalStoragePath, spoolFileName);
}

export async function appendOtlpSpoolRecords(
  spoolPath: string,
  records: unknown[],
  signal: string,
  options?: { maxSpoolBytes?: number; compactKeepRecords?: number },
): Promise<void> {
  if (records.length === 0) {
    return;
  }

  const receivedAt = new Date().toISOString();
  const lines = records.map((record) =>
    JSON.stringify({ receivedAt, signal, record } satisfies SpooledOtlpRecord),
  );
  await mkdir(path.dirname(spoolPath), { recursive: true });
  await appendFile(spoolPath, `${lines.join("\n")}\n`, "utf8");
  await compactOtlpSpoolIfNeeded(
    spoolPath,
    options?.maxSpoolBytes ?? defaultMaxSpoolBytes,
    options?.compactKeepRecords ?? defaultCompactKeepRecords,
  );
}

export async function readOtlpSpoolRecords(
  spoolPath: string,
  maxRecords: number,
): Promise<SpooledOtlpRecord[]> {
  const content = await readSpoolFile(spoolPath);
  if (content === null) {
    return [];
  }

  return parseSpoolLines(content).slice(-maxRecords);
}

export async function statOtlpSpool(
  spoolPath: string,
): Promise<OtlpSpoolStat | null> {
  try {
    const stats = await stat(spoolPath);
    return { sizeBytes: stats.size, modifiedAtMs: stats.mtimeMs };
  } catch {
    return null;
  }
}

async function compactOtlpSpoolIfNeeded(
  spoolPath: string,
  maxSpoolBytes: number,
  compactKeepRecords: number,
) {
  const spoolStat = await statOtlpSpool(spoolPath);
  if (!spoolStat || spoolStat.sizeBytes <= maxSpoolBytes) {
    return;
  }

  const content = await readSpoolFile(spoolPath);
  if (content === null) {
    return;
  }

  const keptLines = content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .slice(-compactKeepRecords);
  const compactPath = `${spoolPath}.compact`;
  await writeFile(compactPath, `${keptLines.join("\n")}\n`, "utf8");
  await rename(compactPath, spoolPath);
}

async function readSpoolFile(spoolPath: string): Promise<string | null> {
  try {
    return await readFile(spoolPath, "utf8");
  } catch {
    return null;
  }
}

function parseSpoolLines(content: string): SpooledOtlpRecord[] {
  return content
    .split("\n")
    .map((line) => parseSpoolLine(line))
    .filter((record): record is SpooledOtlpRecord => record !== null);
}

function parseSpoolLine(line: string): SpooledOtlpRecord | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("record" in parsed)
    ) {
      return null;
    }

    const entry = parsed as Partial<SpooledOtlpRecord>;
    return {
      receivedAt: typeof entry.receivedAt === "string" ? entry.receivedAt : "",
      signal: typeof entry.signal === "string" ? entry.signal : "unknown",
      record: entry.record,
    };
  } catch {
    return null;
  }
}
