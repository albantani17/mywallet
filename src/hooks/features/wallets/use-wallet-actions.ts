import { useCallback, useState } from "react";

import type { WalletWithBalance } from "@/db";

type OpenSheet = { wallet: WalletWithBalance; sheet: "edit" | "delete" } | null;

/**
 * Which wallet the action sheets are working on, and which sheet is showing.
 *
 * Held once at the grid level rather than per card: a single mounted sheet
 * avoids stacking one Modal per wallet, and closing it unmounts the form so
 * the next open starts clean.
 */
export function useWalletActions() {
  const [open, setOpen] = useState<OpenSheet>(null);

  const edit = useCallback((wallet: WalletWithBalance) => {
    setOpen({ wallet, sheet: "edit" });
  }, []);

  const remove = useCallback((wallet: WalletWithBalance) => {
    setOpen({ wallet, sheet: "delete" });
  }, []);

  const close = useCallback(() => setOpen(null), []);

  return {
    activeWallet: open?.wallet ?? null,
    isEditOpen: open?.sheet === "edit",
    isDeleteOpen: open?.sheet === "delete",
    edit,
    remove,
    close,
  };
}
