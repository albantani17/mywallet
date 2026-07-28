import { eq } from "drizzle-orm";

import { db } from "../client";
import type { Locale } from "../schema/users";
import { users } from "../schema/users";
import type { User, UserUpdate } from "../validators/user.validator";

/**
 * The users table is capped at a single row by the `single_user_row` check
 * constraint, so every write here targets id 1 unconditionally.
 */
export const USER_ID = 1;

export const userRepository = {
  /** The local account, or null when onboarding has not happened yet. */
  async getCurrent(): Promise<User | null> {
    const rows = await db.select().from(users).limit(1);
    return rows[0] ?? null;
  },

  async exists(): Promise<boolean> {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .limit(1);
    return rows.length > 0;
  },

  /**
   * Creates the guest account during onboarding. The existence of this row is
   * what marks onboarding as complete. Throws if an account already exists.
   */
  async createGuest(data: { name: string; locale: Locale }): Promise<User> {
    const [row] = await db
      .insert(users)
      .values({
        name: data.name.trim(),
        authProvider: "guest",
        locale: data.locale,
      })
      .returning();
    return row;
  },

  async update(data: UserUpdate): Promise<User | null> {
    const [row] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, USER_ID))
      .returning();
    return row ?? null;
  },

  /** Attaches an email identity to the existing guest account. */
  async linkEmail(email: string): Promise<User | null> {
    const [row] = await db
      .update(users)
      .set({ email, authProvider: "google" })
      .where(eq(users.id, USER_ID))
      .returning();
    return row ?? null;
  },
};
