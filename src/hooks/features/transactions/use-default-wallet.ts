import { schema, transactionQueries, type TransactionType } from "@/db";
import { useWallets } from "@/hooks/features/wallets/use-wallets";
import { useLiveData } from "@/hooks/use-live-data";

/** Both tables are read: the recent rows, and the wallets they must still exist in. */
const DEFAULT_WALLET_TABLES = [schema.transactions, schema.wallets];

/**
 * Which wallet a new transaction should start on.
 *
 * Derived from what was actually used rather than stored as a preference, so
 * it follows a change of habit on its own and needs no migration. The chain is
 * "most recent of this type" → "most recent of any type" → "first wallet",
 * because a first income lands in a different wallet than a first expense but
 * still beats an empty field.
 *
 * Archived wallets are skipped: they are hidden from the picker, so seeding one
 * would show a form with no chip selected and no way to tell why.
 */
export function useDefaultWallet(type: TransactionType) {
  const { data, updatedAt } = useLiveData(
    transactionQueries.recentWallets(),
    DEFAULT_WALLET_TABLES,
    [],
  );
  const { wallets, isReady: walletsReady } = useWallets();

  const isReady = updatedAt !== undefined && walletsReady;
  const selectable = new Set(wallets.map((wallet) => wallet.id));
  const recent = (data ?? []).filter((row) => selectable.has(row.walletId));

  const sameType = recent.find((row) => row.type === type);
  const walletId =
    sameType?.walletId ?? recent[0]?.walletId ?? wallets[0]?.id ?? null;

  return {
    walletId: isReady ? walletId : null,
    // Callers must not seed from a chain that is still resolving — an early
    // null would look like "no default" and never be revisited.
    isReady,
  };
}
