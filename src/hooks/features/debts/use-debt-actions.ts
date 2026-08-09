import { useCallback, useState } from "react";

import type { InstallmentWithPaid, PaymentWithAllocations } from "@/db";

export type DebtSheet =
  | "cancel"
  | "writeOff"
  | "deleteDebt"
  | "deletePayment"
  | "editInstallment";

/**
 * Which sheet the detail screen is showing, and what it is about.
 *
 * The open state lives once at screen level rather than inside each row: a
 * sheet per row would mount one Modal per installment, and a 180-row mortgage
 * would carry 180 of them. Same shape as use-wallet-actions.ts.
 */
export function useDebtActions() {
  const [sheet, setSheet] = useState<DebtSheet | null>(null);
  const [activeInstallment, setActiveInstallment] =
    useState<InstallmentWithPaid | null>(null);
  const [activePayment, setActivePayment] =
    useState<PaymentWithAllocations | null>(null);

  const close = useCallback(() => setSheet(null), []);

  const editInstallment = useCallback((installment: InstallmentWithPaid) => {
    setActiveInstallment(installment);
    setSheet("editInstallment");
  }, []);

  const deletePayment = useCallback((payment: PaymentWithAllocations) => {
    setActivePayment(payment);
    setSheet("deletePayment");
  }, []);

  return {
    sheet,
    activeInstallment,
    activePayment,
    isEditInstallmentOpen: sheet === "editInstallment",
    isCancelOpen: sheet === "cancel",
    isWriteOffOpen: sheet === "writeOff",
    isDeleteDebtOpen: sheet === "deleteDebt",
    isDeletePaymentOpen: sheet === "deletePayment",
    editInstallment,
    deletePayment,
    cancelDebt: useCallback(() => setSheet("cancel"), []),
    writeOffDebt: useCallback(() => setSheet("writeOff"), []),
    deleteDebt: useCallback(() => setSheet("deleteDebt"), []),
    close,
  };
}
