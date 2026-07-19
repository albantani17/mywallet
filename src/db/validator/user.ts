import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "../schema";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Nama wajib diisi")
  .max(50, "Nama terlalu panjang");

export const userSelectSchema = createSelectSchema(usersTable);

export const userInsertSchema = createInsertSchema(usersTable).extend({
  name: nameSchema,
});

export const userUpdateSchema = createUpdateSchema(usersTable).extend({
  name: nameSchema.optional(),
});

export type User = z.infer<typeof userSelectSchema>;
export type UserInsert = z.infer<typeof userInsertSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
