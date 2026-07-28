import { Ionicons } from "@expo/vector-icons";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { formatDate } from "@/utils/format-date";
import { cn } from "@/utils/cn";
import { useThemeColors } from "@/hooks/use-theme-colors";

type DateFieldProps = {
  label: string;
  value: Date | null;
  onChange: (value: Date) => void;
  /** Shown in place of a date when the field is empty and optional. */
  placeholder?: string;
};

/**
 * A tappable date row that opens a calendar in the app's own bottom sheet.
 *
 * The picker is rendered inline (`presentation="inline"`) rather than as the
 * platform dialog: iOS ignores the dialog presentation entirely, so driving it
 * from our sheet is the only way both platforms behave the same. It is mounted
 * only while the sheet is open, so no native host lingers on the screen.
 *
 * The date is committed on confirm rather than on every scroll of the picker,
 * which keeps a half-finished selection out of the form.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder,
}: DateFieldProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  const open = () => {
    setDraft(value ?? new Date());
    setIsOpen(true);
  };

  const confirm = () => {
    onChange(draft);
    setIsOpen(false);
  };

  return (
    <View className="flex-col gap-1.5">
      <Text className="text-sm font-medium text-fg">{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={open}
        className="h-12 flex-row items-center justify-between rounded-xl border border-line bg-elevated px-4 active:opacity-70"
      >
        <Text
          className={cn(
            "text-base",
            value ? "text-fg" : "text-fg-muted",
          )}
        >
          {value ? formatDate(value, locale) : (placeholder ?? "")}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.fgMuted} />
      </Pressable>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <View className="flex-col gap-4">
          <Text className="text-xl font-bold text-fg">{label}</Text>

          {isOpen ? (
            <DateTimePicker
              value={draft}
              mode="date"
              display="inline"
              presentation="inline"
              accentColor={colors.primary}
              onValueChange={(_event, date) => setDraft(date)}
            />
          ) : null}

          <Button label={t("newTransaction.dateConfirm")} onPress={confirm} />
        </View>
      </BottomSheet>
    </View>
  );
}
