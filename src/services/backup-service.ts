import Constants from "expo-constants";
import { File, Paths } from "expo-file-system";

import { backupRepository } from "@/db";

import journal from "../../drizzle/meta/_journal.json";
import {
  BackupError,
  backupFileName,
  parseBackup,
  serializeBackup,
  totalRows,
  type BackupFile,
} from "./backup-format";
import { seedService } from "./seed-service";

export {
  BackupError,
  totalRows,
  type BackupErrorCode,
  type BackupFile,
} from "./backup-format";

/**
 * The newest migration this build ships. Read from the drizzle journal rather
 * than from a hand-maintained constant, so it cannot drift: `npm run
 * db:generate` appends an entry and this follows automatically.
 *
 * The journal JSON is imported directly instead of `drizzle/migrations.js` —
 * that barrel also pulls in every `.sql` file through the inline-import babel
 * plugin, which this module has no use for.
 */
export const LOCAL_SCHEMA_TAG =
  journal.entries.at(-1)?.tag ?? "0000_unknown";

const APP_VERSION = Constants.expoConfig?.version ?? "unknown";

export type PreparedBackup = {
  fileName: string;
  content: string;
  createdAt: Date;
};

export const backupService = {
  /**
   * Reads the whole database into a backup file.
   *
   * Synchronous, because the dump it wraps has to be: reading every table
   * through one connection is the only way to get a consistent snapshot
   * without holding a transaction open across awaits. For a personal ledger
   * the pause is imperceptible; callers still expose it behind a busy flag.
   */
  createBackup(now: Date = new Date()): PreparedBackup {
    const tables = backupRepository.dumpAll();

    return {
      fileName: backupFileName(now),
      content: serializeBackup(tables, {
        appVersion: APP_VERSION,
        schemaTag: LOCAL_SCHEMA_TAG,
        createdAt: now,
      }),
      createdAt: now,
    };
  },

  /**
   * Validates a backup and hands back what it contains, without writing
   * anything. The screen shows this to the user before they confirm, and a
   * rejected file therefore never reaches the database.
   */
  inspectBackup(text: string): BackupFile {
    return parseBackup(text, LOCAL_SCHEMA_TAG);
  },

  /**
   * Replaces every row in the database with the contents of `file`.
   *
   * Takes an already-inspected file rather than raw text, so the validation in
   * `inspectBackup` cannot be skipped by a caller.
   *
   * A snapshot of the current data is written to the cache directory first, so
   * a restore that turns out to be the wrong file is still recoverable — its
   * path comes back in the result and on the error.
   */
  async restoreBackup(file: BackupFile): Promise<{ snapshotUri: string }> {
    const snapshotUri = writeSnapshot();

    const violations = backupRepository.replaceAll(file.tables);
    if (violations.length > 0) {
      throw new BackupError(
        "corrupt",
        `The restored data left ${violations.length} broken reference(s). A snapshot of the previous data is at ${snapshotUri}.`,
      );
    }

    // The backup may predate a built-in category or preset this build expects.
    await seedService.ensureBuiltIns();

    return { snapshotUri };
  },

  /** Writes a backup into the cache directory and returns its file URI. */
  writeToCache(prepared: PreparedBackup): string {
    return writeCacheFile(prepared.fileName, prepared.content);
  },

  /** Reads a file the user picked, or one downloaded into the cache. */
  async readFile(uri: string): Promise<string> {
    return new File(uri).text();
  },
};

const SNAPSHOT_PREFIX = "mywallet-pre-restore-";

function writeSnapshot(): string {
  const now = new Date();
  const prepared = backupService.createBackup(now);

  return writeCacheFile(
    `${SNAPSHOT_PREFIX}${now.getTime()}.json`,
    prepared.content,
  );
}

function writeCacheFile(name: string, content: string): string {
  const file = new File(Paths.cache, name);
  // Overwrite rather than fail: two backups inside the same minute share a
  // name, and the cache may already hold the previous attempt.
  file.create({ overwrite: true, intermediates: true });
  file.write(content);

  return file.uri;
}
