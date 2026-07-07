import { appendFile, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
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

export interface OtlpSpoolAppendResult {
  appendedRecordCount: number;
  droppedOversizedRecordCount: number;
}

export interface OtlpSpoolLimits {
  maxSpoolBytes?: number;
  compactKeepRecords?: number;
  maxRecordBytes?: number;
}

const spoolFileName = "otlp-records.jsonl";
const defaultMaxSpoolBytes = 20 * 1024 * 1024;
const defaultCompactKeepRecords = 2_500;
const defaultMaxRecordBytes = 4 * 1024 * 1024;

export function otlpSpoolPath(globalStoragePath: string) {
  return path.join(globalStoragePath, spoolFileName);
}

const spoolWriteChains = new Map<string, Promise<unknown>>();

export async function appendOtlpSpoolRecords(
  spoolPath: string,
  records: unknown[],
  signal: string,
  options?: OtlpSpoolLimits,
): Promise<OtlpSpoolAppendResult> {
  const previous = spoolWriteChains.get(spoolPath) ?? Promise.resolve();
  const run = previous.then(() =>
    appendOtlpSpoolRecordsUnsafe(spoolPath, records, signal, options),
  );
  // Keep the chain alive even if this write fails, but let the real error
  // propagate to this caller.
  spoolWriteChains.set(
    spoolPath,
    run.catch(() => undefined),
  );
  return run;
}

async function appendOtlpSpoolRecordsUnsafe(
  spoolPath: string,
  records: unknown[],
  signal: string,
  options?: OtlpSpoolLimits,
): Promise<OtlpSpoolAppendResult> {
  if (records.length === 0) {
    return { appendedRecordCount: 0, droppedOversizedRecordCount: 0 };
  }

  const receivedAt = new Date().toISOString();
  const maxRecordBytes = options?.maxRecordBytes ?? defaultMaxRecordBytes;
  const lines = records.map((record) =>
    JSON.stringify({ receivedAt, signal, record } satisfies SpooledOtlpRecord),
  );
  // Oversized records would dominate the spool and force expensive rewrites
  // on every append, so drop them instead of spooling.
  const keptLines = lines.filter(
    (line) => Buffer.byteLength(line, "utf8") <= maxRecordBytes,
  );
  const droppedOversizedRecordCount = lines.length - keptLines.length;
  if (keptLines.length === 0) {
    return { appendedRecordCount: 0, droppedOversizedRecordCount };
  }

  await mkdir(path.dirname(spoolPath), { recursive: true });
  await appendFile(spoolPath, `${keptLines.join("\n")}\n`, "utf8");
  await compactOtlpSpoolIfNeeded(
    spoolPath,
    options?.maxSpoolBytes ?? defaultMaxSpoolBytes,
    options?.compactKeepRecords ?? defaultCompactKeepRecords,
  );
  return {
    appendedRecordCount: keptLines.length,
    droppedOversizedRecordCount,
  };
}

export async function readOtlpSpoolRecords(
  spoolPath: string,
  maxRecords: number,
): Promise<SpooledOtlpRecord[]> {
  const content = await readSpoolFile(spoolPath);
  if (content === null) {
    return [];
  }

  return parseSpoolLinesTail(content, maxRecords);
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

  const keptLines = selectCompactedLines(
    content,
    maxSpoolBytes,
    compactKeepRecords,
  );
  const compactPath = `${spoolPath}.compact-${process.pid}`;
  try {
    await writeFile(compactPath, `${keptLines.join("\n")}\n`, "utf8");
    await rename(compactPath, spoolPath);
  } catch (error) {
    await rm(compactPath, { force: true });
    throw error;
  }
}

function selectCompactedLines(
  content: string,
  maxSpoolBytes: number,
  compactKeepRecords: number,
): string[] {
  // Compact down to half the cap so steady-state appends do not trigger a
  // full-file rewrite every time, and enforce the budget in bytes: a record
  // cap alone lets large lines keep the spool permanently oversized.
  const keepByteBudget = Math.max(1, Math.floor(maxSpoolBytes / 2));
  const lines = content
    .split("\n")
    .filter((line) => line.trim().length > 0);
  const keptLines: string[] = [];
  let keptBytes = 0;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index] ?? "";
    const lineBytes = Buffer.byteLength(line, "utf8") + 1;
    if (
      keptLines.length >= compactKeepRecords ||
      (keptLines.length > 0 && keptBytes + lineBytes > keepByteBudget)
    ) {
      break;
    }
    keptLines.push(line);
    keptBytes += lineBytes;
  }

  return keptLines.reverse();
}

async function readSpoolFile(spoolPath: string): Promise<string | null> {
  try {
    return await readFile(spoolPath, "utf8");
  } catch {
    return null;
  }
}

function parseSpoolLinesTail(
  content: string,
  maxRecords: number,
): SpooledOtlpRecord[] {
  // Parse from the end and stop at maxRecords so a large spool does not turn
  // into a large object graph just to be sliced away.
  const lines = content.split("\n");
  const records: SpooledOtlpRecord[] = [];
  for (
    let index = lines.length - 1;
    index >= 0 && records.length < maxRecords;
    index -= 1
  ) {
    const record = parseSpoolLine(lines[index] ?? "");
    if (record !== null) {
      records.push(record);
    }
  }

  return records.reverse();
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
