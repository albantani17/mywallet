import { eq } from "drizzle-orm";
import { db } from "../";
import { usersTable } from "../schema";
import { User, UserUpdate } from "../validator/user";

export type Locale = "en" | "id";

export const userQueries = {
  /** Ambil satu-satunya baris user (tabel dibatasi 1 baris). */
  async getCurrentUser(): Promise<User | null> {
    const result = await db.select().from(usersTable).limit(1);
    return result[0] ?? null;
  },

  /** Buat user tamu saat onboarding. Baris ini menandai onboarding selesai. */
  async createGuestUser(data: { name: string; locale: Locale }) {
    const result = await db.insert(usersTable).values({
      name: data.name,
      authProvider: "guest",
      locale: data.locale,
    });

    return result;
  },

  async updateUser(data: UserUpdate) {
    const result = await db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, 1));

    return result;
  },
};
