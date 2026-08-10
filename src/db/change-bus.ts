/**
 * Fan-out for database changes, free of any expo-sqlite import so it can be
 * unit-tested on its own. `table-changes.ts` wires the real listener into it.
 *
 * Two jobs: remember which tables were touched, and tell each subscriber once
 * per burst rather than once per row.
 */

type Subscriber = {
  tables: readonly string[];
  onChange: () => void;
};

export type ChangeBus = {
  /** Feed one change in. Broadcasts after the coalescing window. */
  record: (tableName: string) => void;
  subscribe: (tables: readonly string[], onChange: () => void) => () => void;
};

/**
 * @param coalesceMs How long changes are gathered before subscribers hear
 * about them. SQLite calls its update hook once per row and *before* the
 * transaction commits: recording a payment writes a transaction row, a payment
 * and one allocation per installment inside a single transaction, so without a
 * window a single payment would fire a dozen re-queries — the first of them
 * against a half-written database.
 */
export function createChangeBus(coalesceMs = 50): ChangeBus {
  const subscribers = new Set<Subscriber>();
  let pending: Set<string> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    const changed = pending;
    pending = null;
    if (!changed) return;

    // Copied first: a subscriber may unsubscribe while being notified, and
    // deleting from the live set mid-iteration would skip its neighbour.
    for (const subscriber of [...subscribers]) {
      if (subscriber.tables.some((table) => changed.has(table))) {
        subscriber.onChange();
      }
    }
  };

  return {
    record(tableName) {
      (pending ??= new Set()).add(tableName);
      timer ??= setTimeout(flush, coalesceMs);
    },

    subscribe(tables, onChange) {
      const subscriber: Subscriber = { tables, onChange };
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
  };
}
