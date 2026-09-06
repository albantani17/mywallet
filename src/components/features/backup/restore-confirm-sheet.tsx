import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { PendingRestore } from "@/hooks/features/backup/use-restore";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatDate } from "@/utils/format-date";

type RestoreConfirmSheetProps = {
  pending: PendingRestore | null;
  error: string | null;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * The last step before every row on the device is replaced.
 *
 * It borrows the type-the-word ceremony from `wallet-delete-sheet`, for the
 * same reason: this is not a step that should ever be cleared by reflex, and
 * unlike deleting one wallet there is nothing left to undo it with afterwards.
 */
export function RestoreConfirmSheet({
  pending,
  error,
  isSubmitting,
  onConfirm,
  onClose,
}: RestoreConfirmSheetProps) {
  const colors = useThemeColors();
  const { locale } = useActiveLocale();
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");

  const keyword = t("backup.confirm.keyword");
  const isConfirmed = typed.trim().toUpperCase() === keyword;

  // A successful restore closes the sheet from the outside, without going
  // through `close`. Clearing here too means the next restore starts from an
  // empty field rather than an already-satisfied one.
  useEffect(() => {
    if (pending === null) setTyped("");
  }, [pending]);

  const close = () => {
    setTyped("");
    onClose();
  };

  return (
    <BottomSheet isOpen={pending !== null} onClose={close}>
      <View className="flex-col gap-4">
        <View className="flex-row items-center gap-3">
          <View className="size-10 flex-col items-center justify-center rounded-full bg-red-100">
            <Ionicons name="warning-outline" size={20} color={colors.danger} />
          </View>
          <Text className="flex-1 text-lg font-bold text-fg">
            {t("backup.confirm.title")}
          </Text>
        </View>

        {pending ? (
          <Text className="text-sm font-semibold text-fg">
            {t("backup.confirm.summary", {
              date: formatDate(pending.createdAt, locale),
              count: pending.rows,
            })}
          </Text>
        ) : null}

        <Text className="text-sm leading-5 text-fg-muted">
          {t("backup.confirm.message")}
        </Text>

        <View className="flex-col gap-2">
          <Text className="text-sm text-fg">
            {t("backup.confirm.typePrompt", { keyword })}
          </Text>
          <TextField
            value={typed}
            onChangeText={setTyped}
            placeholder={keyword}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        <View className="mt-1 flex-row justify-end gap-3">
          <Button
            variant="ghost"
            label={t("backup.confirm.cancel")}
            isDisabled={isSubmitting}
            onPress={close}
          />
          <Button
            variant="destructive"
            label={t("backup.confirm.submit")}
            isDisabled={!isConfirmed}
            isLoading={isSubmitting}
            onPress={onConfirm}
            className="px-6"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
