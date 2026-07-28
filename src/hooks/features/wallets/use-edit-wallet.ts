import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { WalletType, WalletWithBalance } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { isWalletUsed, walletService } from "@/services/wallet-service";
import { formatAmount, parseAmountInput } from "@/utils/format-currency";

type Errors = Partial<Record<"name" | "initialBalance" | "form", string>>;

const MAX_BALANCE = 999_999_999_999;

/**
 * Edit form for one wallet. When the wallet already has history only the name
 * is editable — the sheet disables the other fields and walletService drops
 * them regardless.
 */
export function useEditWallet(wallet: WalletWithBalance, onSaved: () => void) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const [name, setName] = useState(wallet.name);
  const [type, setType] = useState<WalletType>(wallet.type);
  const [balanceValue, setBalanceValue] = useState<number | null>(
    wallet.initialBalance,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasUsage = isWalletUsed(wallet);

  const initialBalance =
    balanceValue === null ? "" : formatAmount(balanceValue, locale);

  const changeName = useCallback((value: string) => {
    setName(value);
    setErrors((prev) => ({ ...prev, name: undefined, form: undefined }));
  }, []);

  const changeInitialBalance = useCallback(
    (value: string) => {
      setErrors((prev) => ({
        ...prev,
        initialBalance: undefined,
        form: undefined,
      }));

      if (value.trim() === "") {
        setBalanceValue(null);
        return;
      }

      const parsed = parseAmountInput(value);
      if (parsed === null) return;

      if (Math.abs(parsed) > MAX_BALANCE) {
        setErrors((prev) => ({
          ...prev,
          initialBalance: t("createWallet.balanceTooLarge"),
        }));
        return;
      }

      setBalanceValue(parsed);
    },
    [t],
  );

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setErrors({ name: t("createWallet.nameRequired") });
      return;
    }
    if (trimmed.length > 50) {
      setErrors({ name: t("createWallet.nameTooLong") });
      return;
    }

    setIsSubmitting(true);
    try {
      await walletService.updateWallet(
        wallet.id,
        { name: trimmed, type, initialBalance: balanceValue ?? 0 },
        { hasUsage },
      );
      setIsSubmitting(false);
      onSaved();
    } catch (e) {
      console.error("Failed to update the wallet", e);
      setErrors({ form: t("wallets.edit.failed") });
      setIsSubmitting(false);
    }
  }, [balanceValue, hasUsage, isSubmitting, name, onSaved, t, type, wallet.id]);

  return {
    name,
    type,
    initialBalance,
    errors,
    isSubmitting,
    hasUsage,
    usageCount: Number(wallet.transactionCount) + Number(wallet.debtCount),
    changeName,
    changeInitialBalance,
    changeType: setType,
    submit,
  };
}
