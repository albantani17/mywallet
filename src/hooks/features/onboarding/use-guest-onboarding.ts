import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { userService } from "@/services/user-service";

/**
 * Form state for creating the guest account. The component renders a field and
 * a button from what this returns and stays unaware of validation or services.
 *
 * There is no navigation on success: the inserted row is picked up by
 * useCurrentUser's live query, which swaps the screen on its own.
 */
export function useGuestOnboarding(onSuccess: () => void) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeName = useCallback((value: string) => {
    setName(value);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (isSubmitting) return;

    // Mirrors the name rules in src/db/validators/user.validator.ts, but with
    // messages in the language that is active right now.
    const schema = z
      .string()
      .trim()
      .min(1, t("onboarding.nameModal.required"))
      .max(50, t("onboarding.nameModal.tooLong"));

    const parsed = schema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? null);
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.createGuestAccount(parsed.data);
      // Clear the flag rather than relying on an imminent unmount — if the
      // caller does not navigate, a stuck flag locks the button forever.
      setIsSubmitting(false);
      onSuccess();
    } catch (e) {
      console.error("Failed to create the guest account", e);
      setError(t("onboarding.nameModal.failed"));
      setIsSubmitting(false);
    }
  }, [isSubmitting, name, onSuccess, t]);

  const reset = useCallback(() => {
    setName("");
    setError(null);
  }, []);

  return { name, error, isSubmitting, changeName, submit, reset };
}
