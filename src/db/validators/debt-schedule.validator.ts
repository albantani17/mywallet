import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { debtSchedules } from "../schema/debt-schedules";

// Mirrors valid_due_day. This is the user's intent (e.g. 31), never the
// clamped result, so 31 stays legal in a 30-day month.
const dueDaySchema = z
  .int()
  .min(1, "Due day must be between 1 and 31")
  .max(31, "Due day must be between 1 and 31")
  .nullish();

// Mirrors positive_rounding_unit.
const roundingUnitSchema = z.int().min(1, "Rounding unit must be at least 1");

const daysSchema = z.int().min(0, "Days cannot be negative").max(365, "Days is too large");

// A zero instalment would generate rows of nothing; null is how "no fixed
// instalment, use the rate" is spelled.
const installmentAmountSchema = z
  .int()
  .min(1, "The instalment must be more than zero")
  .nullish();

export const debtScheduleSelectSchema = createSelectSchema(debtSchedules);

export const debtScheduleInsertSchema = createInsertSchema(debtSchedules)
  .extend({
    dueDay: dueDaySchema,
    roundingUnit: roundingUnitSchema.optional(),
    graceDays: daysSchema.optional(),
    reminderDays: daysSchema.optional(),
    installmentAmount: installmentAmountSchema,
  })
  // The zod-side twins of the recurring_shape / single_shape constraints. A
  // schedule the generator cannot read would produce a debt with no
  // installments at all, so it is caught here rather than as a SQLite error.
  .refine(
    (s) =>
      s.scheduleType !== "recurring" ||
      (s.anchorDate != null &&
        s.intervalUnit != null &&
        (s.intervalCount ?? 0) >= 1 &&
        (s.periodCount ?? 0) >= 1),
    {
      message: "A recurring schedule needs an anchor, an interval and a period count",
      path: ["periodCount"],
    },
  )
  .refine((s) => s.scheduleType !== "single" || s.anchorDate != null, {
    message: "A single-payment schedule needs a date",
    path: ["anchorDate"],
  })
  // Custom rows are entered by hand, so a period count here would be a promise
  // the generator never keeps.
  .refine((s) => s.scheduleType !== "custom" || s.periodCount == null, {
    message: "A custom schedule cannot declare a period count",
    path: ["periodCount"],
  });

export const debtScheduleUpdateSchema = createUpdateSchema(
  debtSchedules,
).extend({
  dueDay: dueDaySchema,
  roundingUnit: roundingUnitSchema.optional(),
  graceDays: daysSchema.optional(),
  reminderDays: daysSchema.optional(),
  installmentAmount: installmentAmountSchema,
});

export type DebtSchedule = z.infer<typeof debtScheduleSelectSchema>;
export type DebtScheduleInsert = z.infer<typeof debtScheduleInsertSchema>;
export type DebtScheduleUpdate = z.infer<typeof debtScheduleUpdateSchema>;
