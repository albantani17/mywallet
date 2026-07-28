import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";

import { wallets } from "../schema/wallets";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Wallet name is required")
  .max(50, "Wallet name is too long");

// Minor units; may be negative for a credit-card style wallet.
const initialBalanceSchema = z.int();

export const walletSelectSchema = createSelectSchema(wallets);

export const walletInsertSchema = createInsertSchema(wallets).extend({
  name: nameSchema,
  initialBalance: initialBalanceSchema.optional(),
});

export const walletUpdateSchema = createUpdateSchema(wallets).extend({
  name: nameSchema.optional(),
  initialBalance: initialBalanceSchema.optional(),
});

export type Wallet = z.infer<typeof walletSelectSchema>;
export type WalletInsert = z.infer<typeof walletInsertSchema>;
export type WalletUpdate = z.infer<typeof walletUpdateSchema>;
