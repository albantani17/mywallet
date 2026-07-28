// Public entry point of the data layer. UI and services should import
// repositories from here and leave `db` to the repositories themselves.
export { db, sqliteDb, type Database } from "./client";
export * from "./repositories";
export * from "./validators";

// Flat re-export for the enum tuples and row types (WALLET_TYPES, WalletType,
// …) that UI code needs; the namespace form stays for `schema.users` style
// access inside hooks that build queries.
export * from "./schema";
export * as schema from "./schema";
