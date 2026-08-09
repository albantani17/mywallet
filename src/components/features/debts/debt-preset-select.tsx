import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { TINT_ALPHA } from "@/components/features/shared/icon-choices";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { SelectField } from "@/components/ui/select-field";
import type { DebtDirection, DebtPreset } from "@/db";
import { useDebtPresets } from "@/hooks/features/debts/use-debt-presets";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { cn } from "@/utils/cn";

import { toPresetIcon } from "./debt-presets";

type DebtPresetSelectProps = {
  direction: DebtDirection;
  value: string | null;
  onChange: (preset: DebtPreset | null, label: string) => void;
};

const SCHEDULE_LABEL_KEYS = {
  open: "newDebt.scheduleTypeOpen",
  single: "newDebt.scheduleTypeSingle",
  recurring: "newDebt.scheduleTypeRecurring",
  custom: "newDebt.scheduleTypeCustom",
} as const;

/**
 * The kind of arrangement this debt is — a paylater, a bank loan, money from a
 * friend.
 *
 * Shapes, not brands. The seed used to name SPayLater, Kredivo and friends,
 * which meant an unfinishable list and a rate we had no business publishing on
 * their behalf; the brand now lives on the counterparty, which the app
 * remembers after the first debt.
 *
 * Picking one only fills the form in. Nothing downstream reads the slug except
 * as a label to remember on the counterparty. Every seeded field stays
 * editable, and the ones the user has already edited are left alone.
 */
export function DebtPresetSelect({
  direction,
  value,
  onChange,
}: DebtPresetSelectProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);
  const { byDirection, labelOf, presets } = useDebtPresets();

  const selected = presets.find((preset) => preset.slug === value) ?? null;
  const options = byDirection(direction);

  const choose = (preset: DebtPreset | null) => {
    onChange(preset, preset ? labelOf(preset) : "");
    setIsOpen(false);
  };

  return (
    <>
      <SelectField
        label={t("newDebt.presetLabel")}
        placeholder={t("newDebt.presetPlaceholder")}
        onPress={() => setIsOpen(true)}
      >
        {selected ? (
          <View className="flex-1 flex-row items-center gap-2">
            <View
              className="size-7 flex-col items-center justify-center rounded-full"
              style={{
                backgroundColor: (selected.color ?? colors.primary) + TINT_ALPHA,
              }}
            >
              <Ionicons
                name={toPresetIcon(selected.icon)}
                size={15}
                color={selected.color ?? colors.primary}
              />
            </View>
            <Text className="flex-1 text-base text-fg" numberOfLines={1}>
              {labelOf(selected)}
            </Text>
          </View>
        ) : undefined}
      </SelectField>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <View className="flex-col gap-4">
          <Text className="text-xl font-bold text-fg">
            {t("newDebt.presetSheetTitle")}
          </Text>

          <View className="flex-col">
            <PresetRow
              label={t("newDebt.presetNone")}
              isSelected={selected === null}
              onPress={() => choose(null)}
            />

            {options.map((preset) => (
              <PresetRow
                key={preset.id}
                label={labelOf(preset)}
                subtitle={t(SCHEDULE_LABEL_KEYS[preset.scheduleType])}
                icon={toPresetIcon(preset.icon)}
                tint={preset.color ?? colors.primary}
                isSelected={preset.slug === value}
                onPress={() => choose(preset)}
              />
            ))}
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

function PresetRow({
  label,
  subtitle,
  icon,
  tint,
  isSelected,
  onPress,
}: {
  label: string;
  subtitle?: string;
  icon?: ReturnType<typeof toPresetIcon>;
  tint?: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-1 py-3 active:opacity-70"
    >
      {icon ? (
        <View
          className="size-10 flex-col items-center justify-center rounded-full"
          style={{ backgroundColor: (tint ?? colors.primary) + TINT_ALPHA }}
        >
          <Ionicons name={icon} size={18} color={tint ?? colors.primary} />
        </View>
      ) : (
        <View className="size-10 flex-col items-center justify-center rounded-full bg-elevated">
          <Ionicons name="close-outline" size={18} color={colors.fgMuted} />
        </View>
      )}

      <View className="flex-1 flex-col">
        <Text
          className={cn(
            "text-base",
            isSelected ? "font-semibold text-fg" : "text-fg",
          )}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-fg-muted">{subtitle}</Text>
        ) : null}
      </View>

      {isSelected ? (
        <Ionicons name="checkmark" size={18} color={colors.primary} />
      ) : null}
    </Pressable>
  );
}
