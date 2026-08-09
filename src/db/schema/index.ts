// Aggregate schema entry point. drizzle.config.ts reads this file, and
// src/db/client.ts passes it to drizzle() to enable the db.query.* API.
export * from "./categories";
export * from "./counterparties";
export * from "./debt-presets";
export * from "./debt-schedules";
export * from "./debts";
export * from "./installments";
export * from "./payment-allocations";
export * from "./payments";
export * from "./relations";
export * from "./transactions";
export * from "./users";
export * from "./wallet-categories";
export * from "./wallets";
