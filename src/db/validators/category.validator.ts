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
  .max(30, "Category name is too long");

const slugSchema = z.string().trim().min(1, "Category slug is required");

export const categorySelectSchema = createSelectSchema(categories);

// slug is required despite its `""` column default: the default only exists so
// the column could be added to a shipped table, never as a usable value.
export const categoryInsertSchema = createInsertSchema(categories).extend({
  name: nameSchema,
  slug: slugSchema,
});

export const categoryUpdateSchema = createUpdateSchema(categories).extend({
  name: nameSchema.optional(),
});

export type Category = z.infer<typeof categorySelectSchema>;
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

/** A parent category together with its children, as returned by getTree(). */
export type CategoryTreeNode = Category & { children: Category[] };
