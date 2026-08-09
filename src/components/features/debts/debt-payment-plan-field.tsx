import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { DateField } from "@/components/features/transactions/date-field";
import { TextField } from "@/components/ui/text-field";
import type { ScheduleType } from "@/db";
import type { CreateDebtForm } from "@/hooks/features/debts/use-create-debt";
import { cn } from "@/utils/cn";

import { CustomInstallmentEditor } from "./custom-installment-editor";

type DebtPaymentPlanFieldProps = { form: CreateDebtForm };

const PLAN_LABEL_KEYS = {
  recurring: "newDebt.scheduleTypeRecurring",
  single: "newDebt.scheduleTypeSingle",
  open: "newDebt.scheduleTypeOpen",
} as const;

/**
 * Instalments first: it is what most debts recorded here actually are, and the
 * segmented control reads as a default rather than a question.
 */
const PLANS = ["recurring", "single", "open"] as const satisfies readonly ScheduleType[];

/** Only whole numbers reach the schedule columns, so the parse is deliberately plain. */
const toInt = (value: string): number | null => {
  const digits = value.replace(/[^0-9]/g, "");
  return digits === "" ? null : Number(digits);
};

/**
 * How the debt gets paid back, asked in the terms the user can actually read
 * off the lender's screen.
 *
 * The instalment is an INPUT here, not an output. Nobody opens their paylater
 * app and finds "2.95% flat per month"; they find "3× Rp 1.045.000". Asking for
 * a rate meant asking the user to reverse-engineer a number they were never
 * shown, and then to trust that our arithmetic landed on the same instalment
 * theirs did. Now the quote is copied across and the rate is derived from it —
 * see `interestFor` and `splitFixedAmounts`.
 *
 * The rate-driven path still exists, in the advanced section, for the debts
 * that genuinely are quoted that way.
 */
export function DebtPaymentPlanField({ form }: DebtPaymentPlanFieldProps) {
  const { t } = useTranslation();
  const { draft, errors } = form;
  const isCustom = draft.scheduleType === "custom";

  return (
    <View className="flex-col gap-4">
      <View className="flex-col gap-1.5">
        <Text className="text-sm font-medium text-fg">
          {t("newDebt.planLabel")}
        </Text>

        <View className="flex-row items-center gap-2">
          {PLANS.map((plan) => {
            const isActive = !isCustom && plan === draft.scheduleType;
            return (
              <Pressable
                key={plan}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => form.changeScheduleType(plan)}
                className={cn(
                  "flex-1 flex-col items-center justify-center rounded-xl border px-2 py-2.5",
                  isActive
                    ? "border-primary bg-primary"
                    : "border-line bg-surface",
                )}
              >
                <Text
                  className={cn(
                    "text-center text-xs font-semibold",
                    isActive ? "text-primary-fg" : "text-fg-muted",
                  )}
                >
                  {t(PLAN_LABEL_KEYS[plan])}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {draft.scheduleType === "recurring" ? (
        <>
          {/* Stacked, not side by side. Both labels are full sentences in
              both languages, and in a two-column row the longer one wraps and
              drags its input out of line with the other. */}
          <TextField
            label={t("newDebt.installmentAmountLabel")}
            placeholder={t("newDebt.installmentAmountPlaceholder")}
            value={form.installmentAmount}
            onChangeText={form.changeInstallmentAmount}
            error={errors.installmentAmount}
            keyboardType="number-pad"
            size="large"
          />

          <Text className="-mt-2 text-xs text-fg-muted">
            {t("newDebt.installmentAmountHint")}
          </Text>

          <TextField
            label={t("newDebt.periodCountLabel")}
            value={draft.periodCount === null ? "" : String(draft.periodCount)}
            onChangeText={(value) => form.change("periodCount", toInt(value))}
            error={errors.periodCount}
            keyboardType="number-pad"
            maxLength={3}
          />

          <DateField
            label={t("newDebt.firstDueLabel")}
            value={draft.anchorDate}
            onChange={(value) => form.change("anchorDate", value)}
          />
        </>
      ) : null}

      {draft.scheduleType === "single" ? (
        <>
          <DateField
            label={t("newDebt.dueDateLabel")}
            value={draft.anchorDate}
            onChange={(value) => form.change("anchorDate", value)}
          />

          <View className="flex-col gap-1.5">
            <TextField
              label={t("newDebt.singleAmountLabel")}
              placeholder={t("newDebt.installmentAmountPlaceholder")}
              value={form.installmentAmount}
              onChangeText={form.changeInstallmentAmount}
              error={errors.installmentAmount}
              keyboardType="number-pad"
            />
            <Text className="text-xs text-fg-muted">
              {t("newDebt.singleAmountHint")}
            </Text>
          </View>
        </>
      ) : null}

      {draft.scheduleType === "open" ? (
        <Text className="text-xs text-fg-muted">
          {t("newDebt.scheduleTypeOpenHint")}
        </Text>
      ) : null}

      {isCustom ? (
        <CustomInstallmentEditor
          rows={draft.customRows}
          principal={draft.principal}
          error={errors.customRows}
          onAdd={form.addCustomRow}
          onChange={form.changeCustomRow}
          onRemove={form.removeCustomRow}
        />
      ) : null}

      {/* The escape hatch for a schedule that follows no rule at all — an
          irregular restructure, or a payment book with different amounts on
          every line. Kept as a link rather than a fourth segment because it is
          rare and it replaces the fields above rather than refining them. */}
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          form.changeScheduleType(isCustom ? "recurring" : "custom")
        }
        className="active:opacity-70"
      >
        <Text className="text-sm font-medium text-primary">
          {t(isCustom ? "newDebt.customExit" : "newDebt.customEnter")}
        </Text>
      </Pressable>
    </View>
  );
}
