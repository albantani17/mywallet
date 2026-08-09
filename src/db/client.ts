import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";

import * as schema from "./schema";

export const sqliteDb = SQLite.openDatabaseSync("mywallet.db", {
  // Required by drizzle's useLiveQuery to know when to re-run a query.
  enableChangeListener: true,
});

sqliteDb.execSync("PRAGMA journal_mode = WAL;");
// Off by default in SQLite; the schema leans on FK references, so turn it on.
sqliteDb.execSync("PRAGMA foreign_keys = ON;");

export const db = drizzle(sqliteDb, { schema });

export type Database = typeof db;

/**
 * Either `db` itself or the handle passed to a `db.transaction` callback, so a
 * repository method can run standalone or as part of a larger transaction.
 *
 * Anything taking an Executor must be SYNCHRONOUS. drizzle's expo-sqlite
 * session runs `begin`, calls the callback, then `commit` — an async callback
 * returns a promise and the commit fires immediately, so only the statements
 * before the first `await` would be inside the transaction. Inside one, call
 * `.all()` / `.get()` / `.run()` on the builder and never await.
 */
export type Executor =
  | Database
  | Parameters<Parameters<Database["transaction"]>[0]>[0];
