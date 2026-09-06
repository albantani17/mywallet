import { getTableConfig, type SQLiteTable } from "drizzle-orm/sqlite-core";

import { sqliteDb } from "../client";
import { categories } from "../schema/categories";
import { counterparties } from "../schema/counterparties";
import { debtPresets } from "../schema/debt-presets";
import { debtSchedules } from "../schema/debt-schedules";
import { debts } from "../schema/debts";
import { installments } from "../schema/installments";
import { paymentAllocations } from "../schema/payment-allocations";
import { payments } from "../schema/payments";
import { transactions } from "../schema/transactions";
import { users } from "../schema/users";
import { walletCategories } from "../schema/wallet-categories";
import { wallets } from "../schema/wallets";

/**
 * One row of a dumped table, keyed by SQL column name and holding the value
 * exactly as SQLite stores it — integers, reals, strings, null.
 */
export type BackupRow = Record<string, string | number | null>;

/** Every dumped table, keyed by its SQL name. */
export type BackupTables = Record<string, BackupRow[]>;

/**
 * The tables a backup covers, in an order that satisfies every foreign key
 * when inserted front-to-back (and every one when deleted back-to-front).
 *
 * This list is the single point of maintenance: a table added to
 * `src/db/schema/index.ts` and not added here is silently left out of every
 * backup, so add it in dependency order at the same time.
 *
 * `__drizzle_migrations` is deliberately absent. It is local bookkeeping for
 * the migrator, and restoring another device's copy of it would make the
 * migrator skip migrations this device still needs. The backup carries a
 * schema tag instead — see `backup-service.ts`.
 */
const BACKUP_TABLE_ORDER: SQLiteTable[] = [
  users,
  walletCategories,
  wallets,
  categories,
  counterparties,
  debtPresets,
  debts,
  debtSchedules,
  installments,
  transactions,
  payments,
  paymentAllocations,
];

type TableSpec = {
  name: string;
  columns: string[];
};

const TABLE_SPECS: TableSpec[] = BACKUP_TABLE_ORDER.map((table) => {
  const config = getTableConfig(table);
  return {
    name: config.name,
    columns: config.columns.map((column) => column.name),
  };
});

export const BACKUP_TABLE_NAMES: readonly string[] = TABLE_SPECS.map(
  (spec) => spec.name,
);

/**
 * SQLite compiles a statement with at most 999 bound parameters by default, so
 * a multi-row INSERT has to be split. 900 leaves headroom without making the
 * chunks so small that a large table costs thousands of statements.
 */
const MAX_BOUND_PARAMS = 900;

/** How many rows of a table with `columnCount` columns fit in one INSERT. */
export function rowsPerInsert(columnCount: number): number {
  return Math.max(1, Math.floor(MAX_BOUND_PARAMS / Math.max(1, columnCount)));
}

const quote = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

/**
 * Whole-database dump and load. The only place that reads or writes every
 * table at once, which is why it lives in the data layer rather than in a
 * service.
 *
 * Values are moved as raw SQLite primitives rather than through drizzle's
 * column mappers. Timestamp columns are declared `integer({ mode: "timestamp" })`,
 * so drizzle would hand back `Date` objects on the way out and demand them on
 * the way back in; epoch integers survive a JSON round trip untouched and need
 * no revival step.
 */
export const backupRepository = {
  /** Every row of every backed-up table, keyed by SQL table name. */
  dumpAll(): BackupTables {
    const tables: BackupTables = {};

    for (const spec of TABLE_SPECS) {
      const columns = spec.columns.map(quote).join(", ");
      tables[spec.name] = sqliteDb.getAllSync<BackupRow>(
        `SELECT ${columns} FROM ${quote(spec.name)}`,
      );
    }

    return tables;
  },

  /**
   * Replaces the entire contents of the database with `tables`.
   *
   * Synchronous on purpose, and it must stay that way: the whole point is that
   * every delete and insert lands inside one transaction, and an async task
   * would let the commit fire at the first await with only part of the work
   * done.
   *
   * Writes go through the open connection, so expo-sqlite's update hook fires
   * per row and `table-changes.ts` broadcasts the burst — which is what makes
   * every live query on screen re-read without an app restart.
   *
   * Returns the foreign-key violations left behind, which is always empty for
   * a backup written by this app. A non-empty result means the file was
   * tampered with and the caller should treat the restore as failed.
   */
  replaceAll(tables: BackupTables): { table: string; rowid: number }[] {
    // Turned off so the delete pass does not trip the references the insert
    // pass is about to satisfy. It has to happen out here: `PRAGMA
    // foreign_keys` is a no-op while a transaction is open.
    sqliteDb.execSync("PRAGMA foreign_keys = OFF;");

    try {
      sqliteDb.withTransactionSync(() => {
        for (const spec of [...TABLE_SPECS].reverse()) {
          // `WHERE 1` rather than a bare DELETE, on purpose. SQLite answers an
          // unqualified `DELETE FROM t` with its truncate optimization, which
          // erases the table without visiting a row — and therefore without
          // firing the update hook `table-changes.ts` listens on. A table that
          // ends up empty after a restore would leave every screen still
          // showing the rows it used to hold. Any WHERE clause opts out.
          sqliteDb.runSync(`DELETE FROM ${quote(spec.name)} WHERE 1`);
        }

        for (const spec of TABLE_SPECS) {
          insertRows(spec, tables[spec.name] ?? []);
        }
      });
    } finally {
      sqliteDb.execSync("PRAGMA foreign_keys = ON;");
    }

    return sqliteDb.getAllSync<{ table: string; rowid: number }>(
      "PRAGMA foreign_key_check",
    );
  },
};

function insertRows(spec: TableSpec, rows: BackupRow[]): void {
  if (rows.length === 0) return;

  // Only the columns the dump actually carries. A backup written before a
  // column was added does not mention it, and naming it here would insert
  // NULL over its default — which fails outright for a NOT NULL column like
  // `debts.issued_at`. Leaving it out lets SQLite apply the default instead.
  const columns = spec.columns.filter((column) =>
    rows.some((row) => column in row),
  );
  if (columns.length === 0) return;

  const columnList = columns.map(quote).join(", ");
  const chunkSize = rowsPerInsert(columns.length);

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);

    const placeholders = chunk
      .map(() => `(${columns.map(() => "?").join(", ")})`)
      .join(", ");

    // Ids are written explicitly, never left to AUTOINCREMENT. Foreign keys
    // across the dump point at them, and `users` additionally carries a
    // `CHECK (id = 1)` that a fresh autoincrement value (2, after the delete
    // above) would fail outright.
    const params = chunk.flatMap((row) =>
      columns.map((column) => row[column] ?? null),
    );

    sqliteDb.runSync(
      `INSERT INTO ${quote(spec.name)} (${columnList}) VALUES ${placeholders}`,
      params,
    );
  }
}
