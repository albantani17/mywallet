import {
  type BuildRefine,
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";

import { walletsTable } from "../schema";

/**
 * Refinement bersama untuk kolom-kolom wallet.
 * Dipakai ulang oleh insert & update schema supaya pesan error konsisten.
 */
const refine = {
  name: (schema) =>
    schema.trim().min(1, "Nama dompet wajib diisi").max(50, "Nama terlalu panjang"),
  initialBalance: (schema) =>
    schema.int("Saldo awal harus bilangan bulat"),
  currency: (schema) =>
    schema.trim().length(3, "Kode mata uang harus 3 huruf").toUpperCase(),
  icon: (schema) => schema.max(50),
  color: (schema) =>
    schema.regex(/^#([0-9a-fA-F]{6})$/, "Warna harus format hex, mis. #22C55E"),
  sortOrder: (schema) => schema.int().min(0),
} satisfies BuildRefine<(typeof walletsTable)["_"]["columns"], undefined>;

export const walletSelectSchema = createSelectSchema(walletsTable);

export const walletInsertSchema = createInsertSchema(walletsTable, refine);

export const walletUpdateSchema = createUpdateSchema(walletsTable, refine);

export type Wallet = z.infer<typeof walletSelectSchema>;
export type WalletInsert = z.infer<typeof walletInsertSchema>;
export type WalletUpdate = z.infer<typeof walletUpdateSchema>;

