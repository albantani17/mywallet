import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { walletCategories } from "../schema/wallet-categories";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Category name is required")
  .max(30, "Category name is too long");

export const walletCategorySelectSchema = createSelectSchema(walletCategories);

export const walletCategoryInsertSchema = createInsertSchema(
  walletCategories,
).extend({
  name: nameSchema,
});

export const walletCategoryUpdateSchema = createUpdateSchema(
  walletCategories,
).extend({
  name: nameSchema.optional(),
});

export type WalletCategory = z.infer<typeof walletCategorySelectSchema>;
export type WalletCategoryInsert = z.infer<typeof walletCategoryInsertSchema>;
export type WalletCategoryUpdate = z.infer<typeof walletCategoryUpdateSchema>;
