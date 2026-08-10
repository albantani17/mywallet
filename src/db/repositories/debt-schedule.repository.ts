import { eq } from "drizzle-orm";

import { db, type Executor } from "../client";
import { debtSchedules } from "../schema/debt-schedules";
import type {
  DebtSchedule,
  DebtScheduleInsert,
  DebtScheduleUpdate,
} from "../validators/debt-schedule.validator";

/** Select builders for useLiveQuery — see the note in debt.repository.ts. */
export const debtScheduleQueries = {
  getByDebt: (debtId: number) =>
    db
      .select()
      .from(debtSchedules)
      .where(eq(debtSchedules.debtId, debtId))
      .limit(1),
};

export const debtScheduleRepository = {
  /** One row per debt — the unique index on debtId is what guarantees it. */
  async getByDebt(debtId: number): Promise<DebtSchedule | null> {
    const rows = await debtScheduleQueries.getByDebt(debtId);
    return rows[0] ?? null;
  },

  async create(data: DebtScheduleInsert): Promise<DebtSchedule> {
    const [row] = await db.insert(debtSchedules).values(data).returning();
    return row;
  },

  async updateByDebt(
    debtId: number,
    data: DebtScheduleUpdate,
  ): Promise<DebtSchedule | null> {
    const [row] = await db
      .update(debtSchedules)
      .set(data)
      .where(eq(debtSchedules.debtId, debtId))
      .returning();
    return row ?? null;
  },

  /** Synchronous variants for use inside a db.transaction callback. */
  sync: {
    getByDebt: (debtId: number, exec: Executor = db): DebtSchedule | null =>
      exec
        .select()
        .from(debtSchedules)
        .where(eq(debtSchedules.debtId, debtId))
        .limit(1)
        .all()[0] ?? null,

    insert: (data: DebtScheduleInsert, exec: Executor = db): DebtSchedule => {
      const [row] = exec.insert(debtSchedules).values(data).returning().all();
      return row;
    },

    updateByDebt: (
      debtId: number,
      data: DebtScheduleUpdate,
      exec: Executor = db,
    ): void => {
      exec
        .update(debtSchedules)
        .set(data)
        .where(eq(debtSchedules.debtId, debtId))
        .run();
    },
  },
};
