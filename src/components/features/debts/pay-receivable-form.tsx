import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { DateField } from "@/components/features/transactions/date-field";
import { WalletSelect } from "@/components/features/transactions/wallet-select";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { DebtWithOutstanding } from "@/db";
import { usePayReceivable } from "@/hooks/features/debts/use-pay-receivable";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { formatCurrency } from "@/utils/format-currency";

type PayReceivableFormProps = {
  debt: DebtWithOutstanding;
  onSaved: () => void;
};

export function PayReceivableForm({ debt, onSaved }: PayReceivableFormProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const form = usePayReceivable(debt, onSaved);

  return (
    <View className="flex-col gap-5">
      {/* What is still owed, restated at the top: it is the number the amount
          field is measured against. */}
      <View className="mx-6 flex-col gap-1 rounded-3xl bg-primary-soft p-6">
        <Text className="text-sm text-fg-muted">
          {t("payReceivable.outstandingLabel", { name: debt.counterparty })}
        </Text>
        <Text className="text-2xl font-extrabold text-fg">
          {formatCurrency(form.outstanding, locale)}
        </Text>
        <Text className="text-xs text-fg-muted">
          {t("payReceivable.ofPrincipal", {
            paid: formatCurrency(Number(debt.paid), locale),
            principal: formatCurrency(Number(debt.principal), locale),
          })}
        </Text>
      </View>

      <View className="mx-6 flex-col gap-5 rounded-3xl bg-surface p-6">
        <View className="flex-col gap-1.5">
          <TextField
            label={t("payReceivable.amountLabel")}
            value={form.amount}
            onChangeText={form.changeAmount}
            error={form.errors.amount}
            placeholder={t("payReceivable.amountPlaceholder")}
            keyboardType="number-pad"
            size="large"
          />
          <Text className="text-xs text-fg-muted">
            {form.willSettle
              ? t("payReceivable.willSettle")
              : t("payReceivable.willRemain", {
                  amount: formatCurrency(form.outstanding, locale),
                })}
          </Text>
        </View>

        <View className="flex-col gap-1.5">
          <WalletSelect
            label={t("payReceivable.walletLabel")}
            value={form.walletId}
            onChange={form.changeWalletId}
            error={form.errors.wallet}
            emptyLabel={t("payReceivable.noWallets")}
          />
          <Text className="text-xs text-fg-muted">
            {t("payReceivable.walletHint")}
          </Text>
        </View>

        <DateField
          label={t("payReceivable.dateLabel")}
          value={form.occurredAt}
          onChange={form.changeOccurredAt}
        />

        <TextField
          label={t("payReceivable.noteLabel")}
          value={form.note}
          onChangeText={form.changeNote}
          error={form.errors.note}
          placeholder={t("payReceivable.notePlaceholder")}
          maxLength={200}
          multiline
          size="multiline"
          textAlignVertical="top"
        />

        {form.errors.form ? (
          <Text className="text-sm text-danger">{form.errors.form}</Text>
        ) : null}

        <Button
          label={t("payReceivable.submit")}
          isLoading={form.isSubmitting}
          onPress={form.submit}
        />
      </View>
    </View>
  );
}
