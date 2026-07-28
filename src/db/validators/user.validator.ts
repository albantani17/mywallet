import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { users } from "../schema/users";

// Refinements go through .extend(); the createInsertSchema(table, callback)
// refine form is type-broken against zod 4.
const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(50, "Name is too long");

const emailSchema = z.email("Invalid email address").nullish();

export const userSelectSchema = createSelectSchema(users);

export const userInsertSchema = createInsertSchema(users).extend({
  name: nameSchema,
  email: emailSchema,
});

export const userUpdateSchema = createUpdateSchema(users).extend({
  name: nameSchema.optional(),
  email: emailSchema,
});

export type User = z.infer<typeof userSelectSchema>;
export type UserInsert = z.infer<typeof userInsertSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
