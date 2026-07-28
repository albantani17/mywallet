import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { categories } from "../schema/categories";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Category name is required")
  .max(50, "Category name is too long");

export const categorySelectSchema = createSelectSchema(categories);

export const categoryInsertSchema = createInsertSchema(categories).extend({
  name: nameSchema,
});

export const categoryUpdateSchema = createUpdateSchema(categories).extend({
  name: nameSchema.optional(),
});

export type Category = z.infer<typeof categorySelectSchema>;
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

/** A parent category together with its children, as returned by getTree(). */
export type CategoryTreeNode = Category & { children: Category[] };
