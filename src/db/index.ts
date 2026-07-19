import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

export const expo = SQLite.openDatabaseSync('app.db', {
  enableChangeListener: true,
});

// Enforce foreign keys (schema relies on FK references + CHECK constraints)
expo.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expo);