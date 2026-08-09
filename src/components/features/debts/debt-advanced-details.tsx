import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TextField } from "@/components/ui/text-field";
import { INTERVAL_UNITS, type InterestMethod, type IntervalUnit } from "@/db";
import type { CreateDebtForm } from "@/hooks/features/debts/use-create-debt";
import { useThemeColors } from "@/hooks/use-theme-colors";

import { formatBpsAsPercent } from "./debt-draft";

type DebtAdvancedDetailsProps = { form: CreateDebtForm };

const INTERVAL_LABEL_KEYS = {
  day: "newDebt.intervalDay",
  week: "newDebt.intervalWeek",
  month: "newDebt.intervalMonth",
} as const;

const INTEREST_METHOD_KEYS = {
  none: "newDebt.interestMethodNone",
  flat: "newDebt.interestMethodFlat",
  effective: "newDebt.interestMethodEffective",
  manual: "newDebt.interestMethodManual",
} as const;

const INTEREST_METHODS = [
  "none",
  "flat",
  "effective",
  "manual",
] as const satisfies readonly InterestMethod[];

const toInt = (value: string): number | null => {
  const digits = value.replace(/[^0-9]/g, "");
  return digits === "" ? null : Number(digits);
};

/**
 * Everything the main form deliberately does not ask.
 *
 * These fields used to sit in the middle of the wizard, which meant every user
 * recording a paylater instalment had to walk past a rounding unit and an
 * interest method to reach the save button. They still matter — a KPR really is
 * quoted as a rate, and a lender really does grant grace days — so they are
 * kept, one tap away, with defaults that are right for the common case.
 *
 * Typing a rate here clears the quoted instalment, and vice versa: the two are
 * different ways of stating the same obligation, and holding both would leave
 * the schedule silently favouring one.
 */
export function DebtAdvancedDetails({ form }: DebtAdvancedDetailsProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);
  const { draft, errors } = form;

  const showsSchedule =
    draft.scheduleType === "recurring" || draft.scheduleType === "single";

  return (
    <View className="flex-col gap-4">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((current) => !current)}
        className="flex-row items-center gap-2 active:opacity-70"
      >
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.fgMuted}
        />
        <Text className="text-sm font-medium text-fg-muted">
          {t(isOpen ? "newDebt.advancedHide" : "newDebt.advancedShow")}
        </Text>
      </Pressable>

      {isOpen ? (
        <View className="flex-col gap-5">
          {draft.scheduleType === "recurring" ? (
            <>
              <View className="flex-col gap-1.5">
                <Text className="text-sm font-medium text-fg">
                  {t("newDebt.intervalUnitLabel")}
                </Text>

                <DropdownMenu
                  items={INTERVAL_UNITS.map((unit) => ({
                    key: unit,
                    label: t(INTERVAL_LABEL_KEYS[unit]),
                    onPress: () =>
                      form.change("intervalUnit", unit as IntervalUnit),
                  }))}
                  selectedKey={draft.intervalUnit}
                  matchTriggerWidth
                  accessibilityLabel={t("newDebt.intervalUnitLabel")}
                  trigger={
                    <View className="h-12 flex-row items-center gap-2 rounded-xl border border-line bg-elevated px-4">
                      <Text className="flex-1 text-base text-fg">
                        {t(INTERVAL_LABEL_KEYS[draft.intervalUnit])}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={colors.fgMuted}
                      />
                    </View>
                  }
                />
              </View>

              <TextField
                label={t("newDebt.intervalCountLabel")}
                value={
                  draft.intervalCount === null ? "" : String(draft.intervalCount)
                }
                onChangeText={(value) =>
                  form.change("intervalCount", toInt(value))
                }
                error={errors.intervalCount}
                keyboardType="number-pad"
                maxLength={2}
              />

              {/* Only months have a day to clamp; a weekly schedule steps by
                  days and would ignore this entirely. */}
              {draft.intervalUnit === "month" ? (
                <View className="flex-col gap-1.5">
                  <TextField
                    label={t("newDebt.dueDayLabel")}
                    placeholder={t("newDebt.dueDayPlaceholder")}
                    value={draft.dueDay === null ? "" : String(draft.dueDay)}
                    onChangeText={(value) => form.change("dueDay", toInt(value))}
                    error={errors.dueDay}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text className="text-xs text-fg-muted">
                    {t("newDebt.dueDayHint")}
                  </Text>
                </View>
              ) : null}
            </>
          ) : null}

          {showsSchedule ? (
            <>
              <View className="flex-col gap-1.5">
                <TextField
                  label={t("newDebt.interestRateLabel")}
                  value={formatBpsAsPercent(draft.interestRateBps)}
                  onChangeText={form.changeInterestRate}
                  error={errors.interestRateBps}
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
                <Text className="text-xs text-fg-muted">
                  {t("newDebt.interestRateAdvancedHint")}
                </Text>
              </View>

              <View className="flex-col gap-1.5">
                <Text className="text-sm font-medium text-fg">
                  {t("newDebt.interestMethodLabel")}
                </Text>

                <DropdownMenu
                  items={INTEREST_METHODS.map((method) => ({
                    key: method,
                    label: t(INTEREST_METHOD_KEYS[method]),
                    onPress: () => form.change("interestMethod", method),
                  }))}
                  selectedKey={draft.interestMethod}
                  matchTriggerWidth
                  accessibilityLabel={t("newDebt.interestMethodLabel")}
                  trigger={
                    <View className="h-12 flex-row items-center gap-2 rounded-xl border border-line bg-elevated px-4">
                      <Text className="flex-1 text-base text-fg">
                        {t(INTEREST_METHOD_KEYS[draft.interestMethod])}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={colors.fgMuted}
                      />
                    </View>
                  }
                />
              </View>

              <TextField
                label={t("newDebt.graceDaysLabel")}
                value={String(draft.graceDays)}
                onChangeText={(value) =>
                  form.change("graceDays", toInt(value) ?? 0)
                }
                keyboardType="number-pad"
                maxLength={3}
              />

              <TextField
                label={t("newDebt.reminderDaysLabel")}
                value={String(draft.reminderDays)}
                onChangeText={(value) =>
                  form.change("reminderDays", toInt(value) ?? 0)
                }
                keyboardType="number-pad"
                maxLength={3}
              />

              <TextField
                label={t("newDebt.roundingUnitLabel")}
                value={String(draft.roundingUnit)}
                onChangeText={(value) =>
                  form.change("roundingUnit", Math.max(toInt(value) ?? 1, 1))
                }
                keyboardType="number-pad"
                maxLength={7}
              />
            </>
          ) : null}

          <TextField
            label={t("newDebt.noteLabel")}
            placeholder={t("newDebt.notePlaceholder")}
            value={draft.note}
            onChangeText={(value) => form.change("note", value)}
            error={errors.note}
            multiline
            size="multiline"
            textAlignVertical="top"
            maxLength={500}
          />
        </View>
      ) : null}
    </View>
  );
}
