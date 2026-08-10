import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { InstallmentWithPaid } from "@/db";
import type { RecordPaymentForm } from "@/hooks/features/debts/use-record-payment";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { byOldestFirst } from "@/services/payment-allocator";
import { formatAmount, formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

type PaymentAllocationEditorProps = {
  form: RecordPaymentForm;
  installments: InstallmentWithPaid[];
  currency: string;
};

/**
 * Choosing which installments a payment closes.
 *
 * Kept behind a toggle because almost nobody needs it: the automatic split
 * pays the oldest arrears first, which is what a lender does anyway. It exists
 * for the case the automatic answer is wrong — a payment the lender booked
 * against a specific month — and being unable to say so would leave the app
 * disagreeing with the statement forever.
 */
export function PaymentAllocationEditor({
  form,
  installments,
  currency,
}: PaymentAllocationEditorProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  // Only rows that can still take money, oldest first — the same order the
  // automatic plan uses, so the two read as the same list.
  const rows = installments
    .filter((installment) => installment.remaining > 0)
    .sort(byOldestFirst);

  return (
    <View className="flex-col gap-3">
      <Text className="text-xs text-fg-muted">{t("newPayment.manualHint")}</Text>

      {rows.map((installment) => (
        <View
          key={installment.id}
          className="flex-col gap-2 rounded-2xl border border-line bg-elevated p-3"
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-semibold text-fg-muted">
              #{installment.sequence}
            </Text>
            <Text className="flex-1 text-xs text-fg-muted" numberOfLines={1}>
              {installment.dueDate
                ? formatDate(installment.dueDate, locale)
                : t("debtDetail.noDueDate")}
            </Text>
            <Text className="text-xs text-fg-muted">
              {t("newPayment.manualRemaining", {
                amount: formatCurrency(installment.remaining, locale, currency),
              })}
            </Text>
          </View>

          <TextField
            value={
              form.manual[installment.id] == null
                ? ""
                : formatAmount(form.manual[installment.id] as number, locale)
            }
            onChangeText={(value) =>
              form.changeManualAmount(installment.id, value)
            }
            keyboardType="number-pad"
          />
        </View>
      ))}

      {form.allocationMessage ? (
        <Text className="text-xs text-danger">{form.allocationMessage}</Text>
      ) : null}

      {form.errors.allocation ? (
        <Text className="text-xs text-danger">{form.errors.allocation}</Text>
      ) : null}

      <Button
        label={t("newPayment.manualReset")}
        variant="secondary"
        onPress={form.resetManual}
      />
    </View>
  );
}
