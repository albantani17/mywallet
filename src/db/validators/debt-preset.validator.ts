import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { debtPresets } from "../schema/debt-presets";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Preset name is required")
  .max(60, "Preset name is too long");

// The slug doubles as an i18n key segment (`debts.presets.<slug>`), so it has
// to stay a plain lowercase identifier.
const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(60, "Slug is too long")
  .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, digits and dashes");

export const debtPresetSelectSchema = createSelectSchema(debtPresets);

export const debtPresetInsertSchema = createInsertSchema(debtPresets).extend({
  slug: slugSchema,
  name: nameSchema,
});

export const debtPresetUpdateSchema = createUpdateSchema(debtPresets).extend({
  slug: slugSchema.optional(),
  name: nameSchema.optional(),
});

export type DebtPreset = z.infer<typeof debtPresetSelectSchema>;
export type DebtPresetInsert = z.infer<typeof debtPresetInsertSchema>;
export type DebtPresetUpdate = z.infer<typeof debtPresetUpdateSchema>;
