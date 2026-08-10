import type { CounterpartyKind } from "@/db";
import type { InstallmentStatus } from "@/services/debt-status";

/**
 * How an installment row is allowed to look.
 *
 * Identical to `InstallmentStatus` except for one extra value: `late` is an
 * overdue installment that must not be shouted about. Money owed to a bank
 * past its date is a problem with a deadline; money owed to your sister is a
 * conversation, and painting it red makes the app feel like a debt collector —
 * which is how people stop recording those debts at all.
 *
 * The rule lives in this one function so it cannot be half-applied across a
 * dozen ternaries in JSX. `debtTone` does the same job at debt level.
 */
export const INSTALLMENT_TONES = [
  "paid",
  "partial",
  "overdue",
  "late",
  "upcoming",
  "open",
] as const;

export type InstallmentTone = (typeof INSTALLMENT_TONES)[number];

export function installmentTone(
  status: InstallmentStatus,
  counterpartyKind: CounterpartyKind | null,
): InstallmentTone {
  // An unknown kind is treated as a person: never accuse on a guess.
  if (status === "overdue" && counterpartyKind !== "institution") return "late";
  return status;
}
