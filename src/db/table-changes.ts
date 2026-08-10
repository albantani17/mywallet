import { addDatabaseChangeListener } from "expo-sqlite";

import { createChangeBus } from "./change-bus";

/**
 * One database change listener for the whole app.
 *
 * drizzle's `useLiveQuery` subscribes to a single table — the one the query
 * selects FROM — so every figure derived from another table goes stale
 * silently. A wallet balance is summed from `transactions` but its query reads
 * FROM `wallets`; a debt's paid amount is summed from `payment_allocations` but
 * its query reads FROM `debts`. Recording a payment therefore changed nothing
 * on screen until the user pulled to refresh.
 *
 * This bus lets a query say which tables it *actually* reads, joins and
 * subqueries included. See `useLiveData`.
 */
const bus = createChangeBus();

// Registered once, when the data layer is first imported. `enableChangeListener`
// is set on the connection in client.ts, which is what makes this fire at all.
addDatabaseChangeListener(({ tableName }) => bus.record(tableName));

/**
 * Call `onChange` whenever any of `tables` is written to. Returns the
 * unsubscribe function, ready to be handed straight back from an effect.
 */
export const subscribeToTables = bus.subscribe;
