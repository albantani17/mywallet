import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { quickEntryAliases } from "../schema/quick-entry-aliases";

/**
 * Normalised on the way in so the unique index actually catches duplicates:
 * "Warteg Bahari" and "warteg  bahari" are the same lesson.
 */
const phraseSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "An alias needs at least two characters")
  .max(60, "An alias is too long to ever match again");

export const quickEntryAliasSelectSchema = createSelectSchema(quickEntryAliases);

export const quickEntryAliasInsertSchema = createInsertSchema(
  quickEntryAliases,
).extend({
  phrase: phraseSchema,
  hits: z.int().min(1).optional(),
});

export const quickEntryAliasUpdateSchema = createUpdateSchema(
  quickEntryAliases,
).extend({
  phrase: phraseSchema.optional(),
});

export type QuickEntryAlias = z.infer<typeof quickEntryAliasSelectSchema>;
export type QuickEntryAliasInsert = z.infer<typeof quickEntryAliasInsertSchema>;
export type QuickEntryAliasUpdate = z.infer<typeof quickEntryAliasUpdateSchema>;
