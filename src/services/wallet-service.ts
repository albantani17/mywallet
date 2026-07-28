import { walletRepository } from "@/db";
import type { WalletType, WalletWithBalance } from "@/db";

export type CreateWalletInput = {
  name: string;
  type: WalletType;
  initialBalance: number;
};

export type UpdateWalletInput = {
  name: string;
  type?: WalletType;
  initialBalance?: number;
};

export type RemoveWalletResult = { action: "deleted" | "archived" };

/** A wallet carries history once anything references it. */
export function isWalletUsed(
  wallet: Pick<WalletWithBalance, "transactionCount" | "debtCount">,
): boolean {
  return Number(wallet.transactionCount) + Number(wallet.debtCount) > 0;
}

/**
 * Business logic around wallets. Screens go through here rather than calling
 * the repository, so ordering rules and defaults live in one place.
 */
export const walletService = {
  /**
   * Creates a wallet and appends it to the end of the display order. sortOrder
   * is derived from the current count rather than stored per-insert, so the
   * first wallet is always 0.
   */
  async createWallet(input: CreateWalletInput) {
    const existing = await walletRepository.list({ includeArchived: true });

    return walletRepository.create({
      name: input.name.trim(),
      type: input.type,
      initialBalance: input.initialBalance,
      sortOrder: existing.length,
    });
  },

  /**
   * Once a wallet has history, only its name may change.
   *
   * The edit sheet also disables those fields, but the rule is enforced here:
   * rewriting an opening balance underneath existing transactions would move
   * every historical balance without touching a single transaction.
   */
  async updateWallet(
    id: number,
    input: UpdateWalletInput,
    { hasUsage }: { hasUsage: boolean },
  ) {
    if (hasUsage) {
      return walletRepository.update(id, { name: input.name.trim() });
    }

    return walletRepository.update(id, {
      name: input.name.trim(),
      type: input.type,
      initialBalance: input.initialBalance,
    });
  },

  /**
   * Removes a wallet from the app.
   *
   * A wallet with no history is deleted outright. One that has been used is
   * archived instead: the foreign keys are ON DELETE no action, so a delete
   * would fail, and erasing its transactions would silently change other
   * wallets' balances through transfers. Archiving hides it and keeps the
   * books correct — the caller reports which of the two happened.
   */
  async removeWallet(wallet: WalletWithBalance): Promise<RemoveWalletResult> {
    if (isWalletUsed(wallet)) {
      await walletRepository.archive(wallet.id);
      return { action: "archived" };
    }

    await walletRepository.remove(wallet.id);
    return { action: "deleted" };
  },

  /** Total across active wallets. */
  async getTotalAssets() {
    return walletRepository.getTotalAssets();
  },
};
