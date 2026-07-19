import {
  type BuildRefine,
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "../schema";

/**
 * Refinement bersama untuk kolom-kolom category.
 * Dipakai ulang oleh insert & update schema supaya pesan error konsisten.
 */
const refine = {
  name: (schema) =>
    schema
      .trim()
      .min(1, "Nama kategori wajib diisi")
      .max(50, "Nama terlalu panjang"),
  icon: (schema) => schema.max(50),
  color: (schema) =>
    schema.regex(/^#([0-9a-fA-F]{6})$/, "Warna harus format hex, mis. #22C55E"),
} satisfies BuildRefine<(typeof categoriesTable)["_"]["columns"], undefined>;

export const categorySelectSchema = createSelectSchema(categoriesTable);
export const categoryInsertSchema = createInsertSchema(categoriesTable, refine);
export const categoryUpdateSchema = createUpdateSchema(categoriesTable, refine);
export type Category = z.infer<typeof categorySelectSchema>;
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
