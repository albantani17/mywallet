import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  COLOR_CHOICES,
  ICON_CHOICES,
} from "@/components/features/wallets/wallet-type";
import { walletCategoryService } from "@/services/wallet-category-service";

/** Form state for creating a wallet category. */
export function useCreateWalletCategory(onCreated: () => void) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(ICON_CHOICES[0]);
  const [color, setColor] = useState<string>(COLOR_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeName = useCallback((value: string) => {
    setName(value);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(t("wallets.categories.nameRequired"));
      return;
    }
    if (trimmed.length > 30) {
      setError(t("wallets.categories.nameTooLong"));
      return;
    }

    setIsSubmitting(true);
    try {
      // The service resolves a unique slug, so a duplicate display name is
      // allowed and will not hit the unique index.
      await walletCategoryService.createCategory({
        name: trimmed,
        icon,
        color,
      });
      setIsSubmitting(false);
      onCreated();
    } catch (e) {
      console.error("Failed to create the wallet category", e);
      setError(t("wallets.categories.failed"));
      setIsSubmitting(false);
    }
  }, [color, icon, isSubmitting, name, onCreated, t]);

  return {
    name,
    icon,
    color,
    error,
    isSubmitting,
    changeName,
    changeIcon: setIcon,
    changeColor: setColor,
    submit,
  };
}
