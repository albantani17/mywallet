import { debtPresetRepository } from "@/db";
import type { DebtPreset, DebtPresetInsert } from "@/db";

export type DebtPresetSeed = Omit<DebtPresetInsert, "isBuiltIn">;

/**
 * The shapes a debt can take — deliberately not a list of brands.
 *
 * An earlier version seeded SPayLater, Kredivo, Akulaku and GoPayLater by name.
 * That list can never be finished (Traveloka, Atome, Indodana, Home Credit, the
 * next one), it puts us in the position of publishing someone else's interest
 * rate, and it still made the user retype the lender's name in the party field
 * because a preset does not fill that in. So the brand now lives where it
 * belongs — as a counterparty the app remembers after the first debt — and a
 * preset only says what KIND of arrangement this is.
 *
 * No preset carries an interest rate any more either: the form asks for the
 * instalment, and the rate is derived from it. A seeded rate would only ever be
 * a guess about a product we cannot see.
 *
 * Names stay as fallbacks; built-ins take their label from
 * `debts.presets.<slug>` and remain translated.
 */
export const BUILT_IN_DEBT_PRESETS: DebtPresetSeed[] = [
  {
    slug: "paylater",
    name: "Paylater / instalment",
    scheduleType: "recurring",
    intervalUnit: "month",
    intervalCount: 1,
    periodCount: 3,
    interestRateBps: 0,
    interestMethod: "none",
    reminderDays: 3,
    icon: "bag-handle-outline",
    color: "#ee4d2d",
    sortOrder: 0,
  },
  {
    slug: "credit-card",
    name: "Credit card",
    scheduleType: "single",
    interestRateBps: 0,
    interestMethod: "none",
    dueDay: 20,
    reminderDays: 5,
    icon: "card-outline",
    color: "#7c3aed",
    sortOrder: 1,
  },
  {
    slug: "bank-loan",
    name: "Bank loan (KTA)",
    scheduleType: "recurring",
    intervalUnit: "month",
    intervalCount: 1,
    periodCount: 12,
    interestRateBps: 0,
    interestMethod: "none",
    graceDays: 3,
    reminderDays: 5,
    icon: "business-outline",
    color: "#2563eb",
    sortOrder: 2,
  },
  {
    slug: "asset-financing",
    name: "Vehicle / property financing",
    scheduleType: "recurring",
    intervalUnit: "month",
    intervalCount: 1,
    periodCount: 36,
    interestRateBps: 0,
    interestMethod: "none",
    graceDays: 3,
    reminderDays: 5,
    icon: "car-sport-outline",
    color: "#d97706",
    sortOrder: 3,
  },
  {
    slug: "personal-loan",
    name: "Borrowed from a person",
    kind: "person",
    direction: "payable",
    // No deadline, no interest: the whole point of borrowing from a friend.
    scheduleType: "open",
    interestRateBps: 0,
    interestMethod: "none",
    reminderDays: 0,
    icon: "person-outline",
    color: "#2f7d57",
    sortOrder: 4,
  },
  {
    slug: "personal-lending",
    name: "Lent to a person",
    kind: "person",
    direction: "receivable",
    scheduleType: "open",
    interestRateBps: 0,
    interestMethod: "none",
    reminderDays: 0,
    icon: "hand-left-outline",
    color: "#2563eb",
    sortOrder: 5,
  },
];

export const debtPresetService = {
  /**
   * Makes sure the built-in presets exist.
   *
   * Runs on every launch after migrations: `onConflictDoNothing` on the unique
   * slug makes it a no-op once they are there, and it backfills a device that
   * upgraded from before the table existed. Rows the user has edited keep
   * their edits — the insert never updates.
   *
   * The sweep afterwards is what actually retires the old brand presets: an
   * insert alone would leave SPayLater and friends sitting in the picker on
   * every device that ever launched the previous build.
   */
  async ensureBuiltIns(
    seeds: DebtPresetSeed[] = BUILT_IN_DEBT_PRESETS,
  ): Promise<void> {
    await debtPresetRepository.insertMissing(
      seeds.map((seed) => ({ ...seed, isBuiltIn: true })),
    );
    await debtPresetRepository.removeRetiredBuiltIns(
      seeds.map((seed) => seed.slug),
    );
  },

  async list(): Promise<DebtPreset[]> {
    return debtPresetRepository.list();
  },
};
