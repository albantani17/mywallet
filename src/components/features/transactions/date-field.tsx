import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatDate } from "@/utils/format-date";

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
    <>
      <SelectField
        label={label}
        placeholder={placeholder}
        onPress={open}
        icon="calendar-outline"
      >
        {value ? (
          <Text className="flex-1 text-base text-fg">
            {formatDate(value, locale)}
          </Text>
        ) : undefined}
      </SelectField>

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
    </>
  );
}
