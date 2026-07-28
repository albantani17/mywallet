// Aggregate schema entry point. drizzle.config.ts reads this file, and
// src/db/client.ts passes it to drizzle() to enable the db.query.* API.
export * from "./categories";
export * from "./debts";
export * from "./relations";
export * from "./transactions";
export * from "./users";
export * from "./wallets";
