import { asc, count, eq, gt } from "drizzle-orm";
import { db } from "../";
import { walletsTable } from "../schema";
import { Wallet, WalletInsert, WalletUpdate } from "../validator";

export const walletQueries = {
  async getWallets(limit = 10, afterId?: number): Promise<Wallet[]> {
    const whereClause = afterId ? gt(walletsTable.id, afterId) : undefined;

    const wallets = await db
      .select()
      .from(walletsTable)
      .where(whereClause)
      .orderBy(asc(walletsTable.id))
      .limit(limit);

    return wallets
  },

  async countWallets(): Promise<number> {
    const [result] = await db.select({ count: count(walletsTable.id) }).from(walletsTable);
    return result.count;
  },

  async insertWallets(data: WalletInsert) {
    const result = await db.insert(walletsTable).values(data)

    return result
  },

  async getWallet(id: number): Promise<Wallet> {
    const result = await db.select().from(walletsTable).where(eq(walletsTable.id, id)).limit(1)

    if (!result.length) {
      throw new Error('Wallet tidak ditemukan')
    }

    return result[0]
  },

  async updateWallets(id: number, data: WalletUpdate) {
    const result = await db.update(walletsTable).set(data).where(eq(walletsTable.id, id))

    return result
  },

  async deleteWallet(id: number) {
    const result = await db.delete(walletsTable).where(eq(walletsTable.id, id))

    return result
  }
};
