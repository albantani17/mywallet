import { asc, count, eq, gt } from "drizzle-orm";
import { db } from "../";
import { categoriesTable } from "../schema";
import { Category, CategoryInsert, CategoryUpdate } from "../validator/category";

export const categoryQueries = {
  async getCategories(limit = 10, afterId?: number): Promise<Category[]> {
    const whereClause = afterId ? gt(categoriesTable.id, afterId) : undefined;

    const categories = await db
      .select()
      .from(categoriesTable)
      .where(whereClause)
      .orderBy(asc(categoriesTable.id))
      .limit(limit);

    return categories;
  },

  async countCategories(): Promise<number> {
    const [result] = await db
      .select({ count: count(categoriesTable.id) })
      .from(categoriesTable);
    return result.count;
  },

  async insertCategories(data: CategoryInsert) {
    const result = await db.insert(categoriesTable).values(data);

    return result;
  },

  async getCategory(id: number): Promise<Category> {
    const result = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .limit(1);

    if (!result.length) {
      throw new Error("Wallet tidak ditemukan");
    }

    return result[0];
  },

  async updateCategory(id: number, data: CategoryUpdate) {
    const result = await db
      .update(categoriesTable)
      .set(data)
      .where(eq(categoriesTable.id, id));

    return result;
  },

  async deleteCategory(id: number) {
    const result = await db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, id));

    return result;
  },
};
