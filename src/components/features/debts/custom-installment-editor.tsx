import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { DateField } from "@/components/features/transactions/date-field";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatAmount, formatCurrency, parseAmountInput } from "@/utils/format-currency";

import type { CustomRowDraft } from "./debt-draft";

type CustomInstallmentEditorProps = {
  rows: CustomRowDraft[];
  principal: number | null;
  error?: string | null;
  onAdd: () => void;
  onChange: (
    key: number,
    patch: Partial<Omit<CustomRowDraft, "key">>,
  ) => void;
  onRemove: (key: number) => void;
};

/**
 * Installments typed in by hand, for a schedule no formula describes — a
 * restructured loan, an uneven plan, a tenor the lender rounded its own way.
 *
 * The rows stay in the order they were entered while the user works. Sorting
 * as they type would move a row out from under the finger mid-edit; the sort
 * happens once, in `buildCustomInstallments`, so step 3 still shows the final
 * order before anything is saved.
 */
export function CustomInstallmentEditor({
  rows,
  principal,
  error,
  onAdd,
  onChange,
  onRemove,
}: CustomInstallmentEditorProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const total = rows.reduce((sum, row) => sum + (row.amountValue ?? 0), 0);
  const difference = principal === null ? 0 : total - principal;

  return (
    <View className="flex-col gap-3">
      <Text className="text-sm font-medium text-fg">
        {t("newDebt.customRowsLabel")}
      </Text>

      {rows.map((row, index) => (
        <View
          key={row.key}
          className="flex-col gap-2 rounded-2xl border border-line bg-elevated p-3"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-fg-muted">
              #{index + 1}
            </Text>

            {/* The last row cannot go: a custom schedule with no rows is not a
                schedule, and the service refuses it anyway. */}
            {rows.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("newDebt.customRemoveRow")}
                onPress={() => onRemove(row.key)}
                hitSlop={8}
                className="size-8 flex-col items-center justify-center rounded-full bg-surface active:opacity-70"
              >
                <Ionicons name="trash-outline" size={15} color={colors.danger} />
              </Pressable>
            ) : null}
          </View>

          <DateField
            label={t("newDebt.customRowDate")}
            value={row.dueDate}
            onChange={(dueDate) => onChange(row.key, { dueDate })}
          />

          <TextField
            label={t("newDebt.customRowAmount")}
            value={
              row.amountValue === null ? "" : formatAmount(row.amountValue, locale)
            }
            onChangeText={(value) => {
              if (value.trim() === "") {
                onChange(row.key, { amountValue: null });
                return;
              }
              const parsed = parseAmountInput(value);
              if (parsed === null) return;
              onChange(row.key, { amountValue: Math.abs(parsed) });
            }}
            keyboardType="number-pad"
          />
        </View>
      ))}

      {error ? <Text className="text-xs text-danger">{error}</Text> : null}

      <Button
        label={t("newDebt.customAddRow")}
        variant="secondary"
        onPress={onAdd}
        startContent={<Ionicons name="add" size={18} color={colors.fg} />}
      />

      <View className="flex-col gap-0.5">
        <Text className="text-xs text-fg-muted">
          {t("newDebt.customTotal", { amount: formatCurrency(total, locale) })}
        </Text>
        {/* Informational only. The lender's paper is allowed to disagree with
            the principal, and blocking on it would be us overruling it. */}
        {difference !== 0 ? (
          <Text className="text-xs text-fg-muted">
            {t("newDebt.customDifference", {
              amount: formatCurrency(Math.abs(difference), locale),
            })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
