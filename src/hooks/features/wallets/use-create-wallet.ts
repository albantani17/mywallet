import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import type { WalletType } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { walletService } from "@/services/wallet-service";
import { formatAmount, parseAmountInput } from "@/utils/format-currency";

type Errors = Partial<Record<"name" | "initialBalance" | "form", string>>;

/** Guards the integer column against an absurd opening balance. */
const MAX_BALANCE = 999_999_999_999;

/**
 * Form state for creating a wallet. No navigation on success — the inserted
 * row is picked up by useWallets' live query, which moves the gate on its own.
 */
export function useCreateWallet(onSuccess?: () => void) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("cash");
  // The balance is held as a number, not the typed text: the separated string
  // is derived below, so it reformats itself when the language changes.
  const [balanceValue, setBalanceValue] = useState<number | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1000000 → "1.000.000" in ID, "1,000,000" in EN.
  const initialBalance =
    balanceValue === null ? "" : formatAmount(balanceValue, locale);

  const changeName = useCallback((value: string) => {
    setName(value);
    setErrors((prev) => ({ ...prev, name: undefined, form: undefined }));
  }, []);

  const changeInitialBalance = useCallback((value: string) => {
    setErrors((prev) => ({ ...prev, initialBalance: undefined, form: undefined }));

    if (value.trim() === "") {
      setBalanceValue(null);
      return;
    }

    // Strips the separators the previous render added, so the digits round-trip.
    const parsed = parseAmountInput(value);
    if (parsed === null) return;

    // Keep what is already typed rather than wiping it, and say why the extra
    // digit did not appear.
    if (Math.abs(parsed) > MAX_BALANCE) {
      setErrors((prev) => ({
        ...prev,
        initialBalance: t("createWallet.balanceTooLarge"),
      }));
      return;
    }

    setBalanceValue(parsed);
  }, [t]);

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const trimmed = name.trim();
    const nextErrors: Errors = {};

    if (trimmed.length === 0) {
      nextErrors.name = t("createWallet.nameRequired");
    } else if (trimmed.length > 50) {
      nextErrors.name = t("createWallet.nameTooLong");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await walletService.createWallet({
        name: trimmed,
        type,
        // An empty field means "start from zero", which is a valid answer.
        // changeInitialBalance already rejected anything unparseable, so the
        // stored number needs no re-validation here.
        initialBalance: balanceValue ?? 0,
      });
      // Always clear the flag. Leaving it set to "wait for the unmount" locks
      // the button forever whenever the caller does not navigate away.
      setIsSubmitting(false);
      onSuccess?.();
    } catch (e) {
      console.error("Failed to create the wallet", e);
      setErrors({ form: t("createWallet.failed") });
      setIsSubmitting(false);
    }
  }, [balanceValue, isSubmitting, name, onSuccess, t, type]);

  return {
    name,
    type,
    initialBalance,
    errors,
    isSubmitting,
    changeName,
    changeInitialBalance,
    changeType: setType,
    submit,
  };
}
