import type {
  InstallmentInsert,
  InterestMethod,
  IntervalUnit,
  ScheduleType,
} from "@/db";

/**
 * Turns a schedule rule into concrete installment rows.
 *
 * This runs ONCE per debt (and again only on an explicit regenerate). Nothing
 * recomputes a due date or an interest figure from these inputs afterwards:
 * a restructure, a penalty or a partial payment would all be erased by a
 * screen that regenerated on open. The formula produces rows; from then on the
 * rows are the truth.
 *
 * Deliberately free of database imports so it can be unit-tested on its own —
 * every `@/db` import here is a type-only one.
 */

/** What the generator needs from the debt header. */
export type GeneratorDebt = {
  /** Original amount in minor units. */
  principal: number;
  /** Per period, in basis points — 1%/month is 100. */
  interestRateBps: number;
  interestMethod: InterestMethod;
};

/** What the generator needs from the schedule rule. */
export type GeneratorSchedule = {
  scheduleType: ScheduleType;
  anchorDate: Date | null;
  /** The user's intent, e.g. 31 — never a clamped result. */
  dueDay: number | null;
  intervalUnit: IntervalUnit | null;
  intervalCount: number | null;
  periodCount: number | null;
  /** Rounding step for installments 1..n-1, in minor units. */
  roundingUnit: number;
  /**
   * The exact total of every installment, in minor units, when the user typed
   * it off the lender's screen ("3× Rp 1.045.000"). Set means the rows are
   * driven by this figure and interest is derived from it; null means the
   * classic path, where interest is charged from a rate.
   */
  installmentAmount?: number | null;
};

/** A row ready to insert, minus the debt it belongs to. */
export type GeneratedInstallment = Omit<InstallmentInsert, "debtId">;

const MS_PER_DAY = 86_400_000;

/** Midnight local, so a due date never drifts a day on a timezone boundary. */
function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year: number, monthIndex: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * The due date of installment `index` (0-based), always measured from the
 * anchor rather than from the previous row.
 *
 * Counting from the previous date drifts permanently the first time a month is
 * short: Jan 31 → Feb 28 → Mar 28 → Apr 28. Re-deriving from `dueDay` gives
 * Jan 31 → Feb 28 → Mar 31 → Apr 30, which is what every lender actually does.
 *
 * Weekends and public holidays are ignored on purpose; lenders keep their date.
 */
export function dueDateFor(
  anchorDate: Date,
  index: number,
  unit: IntervalUnit,
  count: number,
  dueDay: number | null,
): Date {
  const anchor = atMidnight(anchorDate);
  const step = index * count;

  if (unit === "day") return new Date(anchor.getTime() + step * MS_PER_DAY);
  if (unit === "week") return new Date(anchor.getTime() + step * 7 * MS_PER_DAY);

  const intent = dueDay ?? anchor.getDate();
  const target = new Date(anchor.getFullYear(), anchor.getMonth() + step, 1);
  const day = Math.min(
    intent,
    daysInMonth(target.getFullYear(), target.getMonth()),
  );

  return new Date(target.getFullYear(), target.getMonth(), day);
}

/** Nearest multiple of `unit`, used for installments 1..n-1. */
function roundTo(value: number, unit: number): number {
  if (unit <= 1) return Math.round(value);
  return Math.round(value / unit) * unit;
}

/**
 * Interest per period, in minor units, before rounding.
 *
 * `flat` charges the rate on the original principal every period — how nearly
 * every Indonesian paylater and multifinance product quotes itself. `effective`
 * amortises: interest follows the shrinking balance, so the early periods carry
 * more of it. `manual` and `none` charge nothing here; a manual schedule is one
 * the user types in from the lender's own paper.
 */
function interestPerPeriod(
  debt: GeneratorDebt,
  periods: number,
): number[] {
  const rate = debt.interestRateBps / 10_000;

  if (debt.interestMethod === "none" || debt.interestMethod === "manual" || rate === 0) {
    return Array.from({ length: periods }, () => 0);
  }

  if (debt.interestMethod === "flat") {
    const perPeriod = debt.principal * rate;
    return Array.from({ length: periods }, () => perPeriod);
  }

  // effective: annuity payment, then split each period into interest on the
  // outstanding balance and whatever is left as principal.
  const payment =
    periods === 1
      ? debt.principal * (1 + rate)
      : (debt.principal * rate) / (1 - Math.pow(1 + rate, -periods));

  const result: number[] = [];
  let balance = debt.principal;

  for (let i = 0; i < periods; i += 1) {
    const interest = balance * rate;
    result.push(interest);
    balance -= payment - interest;
  }

  return result;
}

/**
 * Splits the obligation into `periods` rows whose totals sum EXACTLY to
 * principal + interest.
 *
 * Rows 1..n-1 are rounded to the schedule's rounding unit — a lender quotes
 * "Rp 933.000/bulan", not 933.333,33 — and the whole accumulated difference
 * lands on the final row. Spreading the remainder instead would leave every
 * row slightly wrong; putting it last matches the payment book the user holds.
 */
function splitAmounts(
  debt: GeneratorDebt,
  periods: number,
  roundingUnit: number,
): { principalAmount: number; interestAmount: number; totalAmount: number }[] {
  const interests = interestPerPeriod(debt, periods);
  const totalInterest = Math.round(interests.reduce((sum, i) => sum + i, 0));
  const grandTotal = debt.principal + totalInterest;

  const rows: {
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
  }[] = [];

  let allocatedTotal = 0;
  let allocatedInterest = 0;

  for (let i = 0; i < periods - 1; i += 1) {
    const interest = Math.round(interests[i]);
    const total = Math.max(
      roundTo(debt.principal / periods + interests[i], roundingUnit),
      interest,
    );

    rows.push({
      interestAmount: interest,
      principalAmount: total - interest,
      totalAmount: total,
    });

    allocatedTotal += total;
    allocatedInterest += interest;
  }

  // The last row absorbs every rounding difference, so SUM(totalAmount) is the
  // obligation to the rupiah.
  const total = Math.max(grandTotal - allocatedTotal, 0);
  const interest = Math.min(Math.max(totalInterest - allocatedInterest, 0), total);

  rows.push({
    interestAmount: interest,
    principalAmount: total - interest,
    totalAmount: total,
  });

  return rows;
}

/**
 * Splits into rows of exactly `installmentAmount`, deriving the interest.
 *
 * This is the path for what a user can actually read off a paylater screen:
 * the instalment is the input and the interest is whatever the lender is
 * charging on top — `instalment × periods − principal`. Nothing is rounded,
 * because the figure was typed, not computed; the sum of the rows is the
 * quoted total to the rupiah by construction.
 *
 * The per-row interest is the total spread evenly, with the last row taking
 * the remainder — the same "last row absorbs the difference" rule as the
 * rate-driven path, so the two agree on where an odd rupiah lands.
 */
function splitFixedAmounts(
  principal: number,
  periods: number,
  installmentAmount: number,
): { principalAmount: number; interestAmount: number; totalAmount: number }[] {
  const totalInterest = Math.max(installmentAmount * periods - principal, 0);
  const perPeriodInterest = Math.round(totalInterest / periods);

  const rows: {
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
  }[] = [];

  let allocatedInterest = 0;

  for (let i = 0; i < periods - 1; i += 1) {
    // Interest can never exceed the row it sits in, or the principal share
    // would go negative on a very short, very expensive schedule.
    const interest = Math.min(perPeriodInterest, installmentAmount);
    rows.push({
      interestAmount: interest,
      principalAmount: installmentAmount - interest,
      totalAmount: installmentAmount,
    });
    allocatedInterest += interest;
  }

  const interest = Math.min(
    Math.max(totalInterest - allocatedInterest, 0),
    installmentAmount,
  );

  rows.push({
    interestAmount: interest,
    principalAmount: installmentAmount - interest,
    totalAmount: installmentAmount,
  });

  return rows;
}

/**
 * The flat monthly rate a fixed instalment works out to, in basis points.
 *
 * Display only — nothing generates from it. The form preview shows it beside
 * the total, and it is what `debts.interest_rate_bps` records for a schedule
 * entered as plain rupiah, so the column does not sit at zero and read as an
 * interest-free loan.
 */
export function flatEquivalentBps(
  principal: number,
  installmentAmount: number,
  periods: number,
): number {
  if (principal <= 0 || periods < 1) return 0;
  const totalInterest = Math.max(installmentAmount * periods - principal, 0);
  return Math.round((totalInterest / principal / periods) * 10_000);
}

function row(
  sequence: number,
  dueDate: Date | null,
  amounts: { principalAmount: number; interestAmount: number; totalAmount: number },
): GeneratedInstallment {
  return {
    sequence,
    dueDate,
    // Kept forever so the detail screen can say "moved from 10 Aug".
    originalDueDate: dueDate,
    principalAmount: amounts.principalAmount,
    interestAmount: amounts.interestAmount,
    feeAmount: 0,
    penaltyAmount: 0,
    totalAmount: amounts.totalAmount,
    isModified: false,
  };
}

/**
 * The four schedule types, and nothing about the product behind them.
 *
 * - `open`     one dateless row for the whole principal — a loan from a friend
 *              with no deadline, paid down by payments whenever they happen.
 * - `single`   one row on the anchor date, principal plus one period of interest.
 * - `recurring` `periodCount` rows stepping from the anchor.
 * - `custom`   nothing: the user enters the rows by hand from the lender's paper.
 */
export function generateInstallments(
  debt: GeneratorDebt,
  schedule: GeneratorSchedule,
): GeneratedInstallment[] {
  const roundingUnit = Math.max(schedule.roundingUnit, 1);
  const fixed =
    schedule.installmentAmount && schedule.installmentAmount > 0
      ? schedule.installmentAmount
      : null;

  /** Fixed instalments when the user gave one, the rate maths otherwise. */
  const split = (periods: number) =>
    fixed
      ? splitFixedAmounts(debt.principal, periods, fixed)
      : splitAmounts(debt, periods, roundingUnit);

  switch (schedule.scheduleType) {
    case "open":
      // No periods, so no interest can be quantified — the row is the principal.
      return [
        row(1, null, {
          principalAmount: debt.principal,
          interestAmount: 0,
          totalAmount: debt.principal,
        }),
      ];

    case "single": {
      if (!schedule.anchorDate) return [];
      const [amounts] = split(1);
      return [row(1, atMidnight(schedule.anchorDate), amounts)];
    }

    case "recurring": {
      const periods = schedule.periodCount ?? 0;
      const unit = schedule.intervalUnit;
      const count = schedule.intervalCount ?? 1;
      if (!schedule.anchorDate || !unit || periods < 1) return [];

      return split(periods).map((amounts, i) =>
        row(
          i + 1,
          dueDateFor(schedule.anchorDate!, i, unit, count, schedule.dueDay),
          amounts,
        ),
      );
    }

    case "custom":
      return [];
  }
}
