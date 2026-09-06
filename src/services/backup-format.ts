import { z } from "zod";

/**
 * The shape of a backup file, and every rule about reading one, with no
 * dependency on expo-sqlite, the filesystem or Drive — so it can be unit
 * tested under `node --test` and, more importantly, so a file can be fully
 * validated before anything touches the database.
 */

export const BACKUP_FORMAT = "mywallet.backup";

/**
 * Bump only for a change this app could not read back. Adding a table or a
 * column is not one: a missing table restores as empty and a missing column
 * falls back to its default, so old files keep working.
 */
export const BACKUP_FORMAT_VERSION = 1;

/** A value as SQLite stores it. No column in this schema holds a blob. */
const cellSchema = z.union([z.string(), z.number(), z.null()]);
const rowSchema = z.record(z.string(), cellSchema);

const backupFileSchema = z.object({
  format: z.string(),
  formatVersion: z.number().int().positive(),
  appVersion: z.string(),
  schemaTag: z.string(),
  createdAt: z.string(),
  counts: z.record(z.string(), z.number().int().nonnegative()),
  tables: z.record(z.string(), z.array(rowSchema)),
});

export type BackupFile = z.infer<typeof backupFileSchema>;
export type BackupRow = z.infer<typeof rowSchema>;
export type BackupTables = Record<string, BackupRow[]>;

export type BackupErrorCode =
  /** Not one of ours — a JSON file, but not a mywallet backup. */
  | "unknownFormat"
  /** Written by a newer app than this one; we would drop data reading it. */
  | "futureFormat"
  /** Its schema is ahead of this device's migrations. */
  | "futureSchema"
  /** Ours, but truncated, hand-edited or otherwise inconsistent. */
  | "corrupt";

export class BackupError extends Error {
  readonly code: BackupErrorCode;

  constructor(code: BackupErrorCode, message: string) {
    super(message);
    this.name = "BackupError";
    this.code = code;
  }
}

/**
 * The numeric prefix drizzle-kit gives every migration —
 * `0006_blushing_changeling` → 6. Ordering by it is what lets us tell a
 * backup from an older app (fine: its migrations replay on the next launch)
 * from one written by a newer app (refused: we cannot know what its rows mean).
 */
export function schemaTagIndex(tag: string): number {
  const match = /^(\d+)/.exec(tag);
  return match ? Number(match[1]) : -1;
}

export type BackupMeta = {
  appVersion: string;
  schemaTag: string;
  createdAt: Date;
};

export function serializeBackup(
  tables: BackupTables,
  meta: BackupMeta,
): string {
  const counts = Object.fromEntries(
    Object.entries(tables).map(([name, rows]) => [name, rows.length]),
  );

  const file: BackupFile = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: meta.appVersion,
    schemaTag: meta.schemaTag,
    createdAt: meta.createdAt.toISOString(),
    counts,
    tables,
  };

  // Indented: the file is small, and a user who opens it should be able to
  // read what they are about to restore.
  return JSON.stringify(file, null, 2);
}

/**
 * Validates a backup completely, or throws a `BackupError` carrying a code the
 * UI maps to a message. Nothing here writes, so a rejected file leaves the
 * database exactly as it was.
 *
 * @param localSchemaTag The newest migration this build ships.
 */
export function parseBackup(text: string, localSchemaTag: string): BackupFile {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new BackupError("corrupt", "The file is not valid JSON.");
  }

  // Read `format` before the full schema check, so picking an unrelated JSON
  // file reports "not a backup" rather than a wall of zod issues.
  if (
    typeof json !== "object" ||
    json === null ||
    (json as { format?: unknown }).format !== BACKUP_FORMAT
  ) {
    throw new BackupError("unknownFormat", "Not a mywallet backup file.");
  }

  const parsed = backupFileSchema.safeParse(json);
  if (!parsed.success) {
    throw new BackupError(
      "corrupt",
      `The backup is malformed: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }

  const file = parsed.data;

  if (file.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new BackupError(
      "futureFormat",
      `The backup uses format version ${file.formatVersion}; this app reads ${BACKUP_FORMAT_VERSION}.`,
    );
  }

  if (schemaTagIndex(file.schemaTag) > schemaTagIndex(localSchemaTag)) {
    throw new BackupError(
      "futureSchema",
      `The backup was written against ${file.schemaTag}; this app is on ${localSchemaTag}.`,
    );
  }

  assertConsistent(file);

  return file;
}

function assertConsistent(file: BackupFile): void {
  for (const [name, rows] of Object.entries(file.tables)) {
    const declared = file.counts[name];
    if (declared !== undefined && declared !== rows.length) {
      throw new BackupError(
        "corrupt",
        `The backup says ${name} has ${declared} rows but carries ${rows.length}.`,
      );
    }
  }

  // The single users row is the app's onboarding-complete flag and every
  // preference it holds. Restoring a dump without it would drop the user back
  // to the welcome screen with their data intact but unreachable.
  const users = file.tables.users;
  if (!users || users.length !== 1) {
    throw new BackupError(
      "corrupt",
      `A backup must carry exactly one account row; this one has ${users?.length ?? 0}.`,
    );
  }
  if (Number(users[0].id) !== 1) {
    throw new BackupError(
      "corrupt",
      `The account row must have id 1; this one has ${String(users[0].id)}.`,
    );
  }
}

/** Total rows across every table — what the confirm sheet counts down from. */
export function totalRows(file: BackupFile): number {
  return Object.values(file.tables).reduce((sum, rows) => sum + rows.length, 0);
}

const pad = (value: number) => String(value).padStart(2, "0");

/** `mywallet-backup-2026-08-18-1432.json`, stamped in the device's own time. */
export function backupFileName(date: Date): string {
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    `${pad(date.getHours())}${pad(date.getMinutes())}`,
  ].join("-");

  return `mywallet-backup-${stamp}.json`;
}
