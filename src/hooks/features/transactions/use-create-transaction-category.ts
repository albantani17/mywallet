import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  COLOR_CHOICES,
  ICON_CHOICES,
} from "@/components/features/transactions/transaction-category";
import type { CategoryType } from "@/db";
import { categoryService } from "@/services/category-service";

/**
 * Form state for creating a transaction category.
 *
 * `type` is not a field: the category always belongs to whichever transaction
 * type the picker below it is showing, so it is passed in rather than chosen.
 * `onCreated` receives the new id so the caller can select it straight away.
 */
export function useCreateTransactionCategory(
  type: CategoryType,
  onCreated: (categoryId: number) => void,
) {
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

  const reset = useCallback(() => {
    setName("");
    setIcon(ICON_CHOICES[0]);
    setColor(COLOR_CHOICES[0]);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError(t("newTransaction.categorySheet.nameRequired"));
      return;
    }
    if (trimmed.length > 30) {
      setError(t("newTransaction.categorySheet.nameTooLong"));
      return;
    }

    setIsSubmitting(true);
    try {
      // The service resolves a unique slug, so a duplicate display name is
      // allowed and will not hit the unique index.
      const created = await categoryService.createCategory({
        name: trimmed,
        type,
        icon,
        color,
      });
      setIsSubmitting(false);
      reset();
      onCreated(created.id);
    } catch (e) {
      console.error("Failed to create the transaction category", e);
      setError(t("newTransaction.categorySheet.failed"));
      setIsSubmitting(false);
    }
  }, [color, icon, isSubmitting, name, onCreated, reset, t, type]);

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
