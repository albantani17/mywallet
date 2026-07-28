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
