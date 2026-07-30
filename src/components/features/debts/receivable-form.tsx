import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { DateField } from "@/components/features/transactions/date-field";
import { WalletSelect } from "@/components/features/transactions/wallet-select";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useCreateReceivable } from "@/hooks/features/debts/use-create-receivable";

type ReceivableFormProps = {
  onSaved: () => void;
};

/**
 * The form body, split from the screen that frames it — the same split as
 * transaction-form / new-transaction-screen.
 *
 * DateField and WalletSelect are borrowed from the transactions folder rather
 * than copied: they are the same controls, and a second copy would drift.
 */
export function ReceivableForm({ onSaved }: ReceivableFormProps) {
  const { t } = useTranslation();
  const form = useCreateReceivable(onSaved);

  return (
    <View className="flex-col gap-5">
      <View className="mx-6 flex-col gap-5 rounded-3xl bg-surface p-6">
        <TextField
          label={t("newReceivable.amountLabel")}
          value={form.amount}
          onChangeText={form.changeAmount}
          error={form.errors.amount}
          placeholder={t("newReceivable.amountPlaceholder")}
          keyboardType="number-pad"
          size="large"
        />

        <TextField
          label={t("newReceivable.counterpartyLabel")}
          value={form.counterparty}
          onChangeText={form.changeCounterparty}
          error={form.errors.counterparty}
          placeholder={t("newReceivable.counterpartyPlaceholder")}
          maxLength={80}
        />

        <View className="flex-col gap-1.5">
          <WalletSelect
            label={t("newReceivable.walletLabel")}
            value={form.walletId}
            onChange={form.changeWalletId}
            error={form.errors.wallet}
            emptyLabel={t("newReceivable.noWallets")}
          />
          {/* Lending is real spending, so the wallet loses the money. Say so
              here rather than letting the balance drop unannounced. */}
          <Text className="text-xs text-fg-muted">
            {t("newReceivable.walletHint")}
          </Text>
        </View>

        <DateField
          label={t("newReceivable.issuedAtLabel")}
          value={form.issuedAt}
          onChange={form.changeIssuedAt}
        />

        <DateField
          label={t("newReceivable.dueDateLabel")}
          value={form.dueDate}
          onChange={form.changeDueDate}
          placeholder={t("newReceivable.dueDatePlaceholder")}
        />

        <TextField
          label={t("newReceivable.noteLabel")}
          value={form.note}
          onChangeText={form.changeNote}
          error={form.errors.note}
          placeholder={t("newReceivable.notePlaceholder")}
          maxLength={200}
          multiline
          size="multiline"
          textAlignVertical="top"
        />

        {form.errors.form ? (
          <Text className="text-sm text-danger">{form.errors.form}</Text>
        ) : null}

        <Button
          label={t("newReceivable.submit")}
          isLoading={form.isSubmitting}
          onPress={form.submit}
        />
      </View>
    </View>
  );
}
