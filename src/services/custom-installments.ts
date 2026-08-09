import type { GeneratedInstallment } from "./schedule-generator";

/**
 * Installments the user typed in by hand, from the lender's own paper.
 *
 * A `custom` schedule is the escape hatch for everything the four generic
 * types cannot express: a restructured loan, an uneven payment plan, a tenor
 * the lender rounded differently to us. No formula runs — the rows the user
 * entered are the rows that get written.
 *
 * Pure, like the generator, so it can be unit-tested without a database.
 */

/** One row as it arrives from the form, before it is known to be complete. */
export type CustomInstallmentRow = {
  dueDate: Date | null;
  totalAmount: number | null;
};

export type CustomInstallmentInput = { dueDate: Date; totalAmount: number };

export type CustomRowsError =
  | { code: "empty" }
  | { code: "missingDate"; index: number }
  | { code: "invalidAmount"; index: number };

/**
 * Reports the first thing wrong with the typed rows, as a code rather than a
 * sentence — this module knows nothing about which language the user reads.
 */
export function validateCustomRows(
  rows: CustomInstallmentRow[],
): CustomRowsError | null {
  if (rows.length === 0) return { code: "empty" };

  for (const [index, row] of rows.entries()) {
    if (!row.dueDate) return { code: "missingDate", index };
    if (row.totalAmount === null || row.totalAmount <= 0) {
      return { code: "invalidAmount", index };
    }
  }

  return null;
}

/**
 * Turns the typed rows into installments ready to insert.
 *
 * Sorting happens here and only here. The editor deliberately leaves the rows
 * where the user put them — a list that re-orders itself under a finger mid-typing
 * is disorienting — so the single sort is applied once, at preview and insert
 * time, which are the same call. The user therefore sees the final order before
 * anything is written.
 *
 * `isModified: true` is load-bearing, not cosmetic. `generateInstallments`
 * returns nothing for a `custom` schedule, so a later `regenerate()` would
 * delete every unprotected row and insert nothing in its place — wiping the
 * whole schedule silently. The flag puts these rows in regenerate's `kept` set,
 * which is exactly what the column means: the generator must not overwrite them.
 *
 * The whole amount is booked as principal: there is no rate to split it with,
 * and inventing an interest share out of a figure the user copied off a
 * statement would be a guess presented as a fact.
 */
export function buildCustomInstallments(
  rows: CustomInstallmentRow[],
): GeneratedInstallment[] {
  return rows
    .filter(
      (row): row is { dueDate: Date; totalAmount: number } =>
        row.dueDate !== null && row.totalAmount !== null && row.totalAmount > 0,
    )
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .map((row, index) => ({
      sequence: index + 1,
      dueDate: row.dueDate,
      originalDueDate: row.dueDate,
      principalAmount: row.totalAmount,
      interestAmount: 0,
      feeAmount: 0,
      penaltyAmount: 0,
      totalAmount: row.totalAmount,
      isModified: true,
    }));
}
