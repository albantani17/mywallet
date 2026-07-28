import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import {
  categoryTypeFor,
  useCreateTransaction,
} from "@/hooks/features/transactions/use-create-transaction";

import { CategoryPicker } from "./category-picker";
import { DateField } from "./date-field";
import { TransactionTypeTabs } from "./transaction-type-tabs";
import { WalletSelect } from "./wallet-select";

type TransactionFormProps = {
  onSaved: () => void;
};

/**
 * The form body, split from the screen that frames it — the same split as
 * create-wallet-form / create-wallet-screen, so the header and the fields can
 * change independently.
 *
 * The type chips live here rather than in the screen because everything below
 * them is driven by the same state; they run full-bleed with their own inset
 * so the row can scroll past the card's margin.
 *
 * Which fields appear is driven entirely by `type`; the hook clears whatever a
 * type cannot carry when it changes.
 */
export function TransactionForm({ onSaved }: TransactionFormProps) {
  const { t } = useTranslation();
  const form = useCreateTransaction(onSaved);

  const isTransfer = form.type === "transfer";
  const isBill = form.type === "bill";
  const categoryType = categoryTypeFor(form.type);

  return (
    <View className="flex-col gap-5">
      <TransactionTypeTabs value={form.type} onChange={form.changeType} />

      <View className="mx-6 flex-col gap-5 rounded-3xl bg-surface p-6">
        <TextField
          label={t("newTransaction.amountLabel")}
          value={form.amount}
          onChangeText={form.changeAmount}
          error={form.errors.amount}
          placeholder={t("newTransaction.amountPlaceholder")}
          keyboardType="number-pad"
          size="large"
        />

        <WalletSelect
          label={
            isTransfer
              ? t("newTransaction.fromWalletLabel")
              : t("newTransaction.walletLabel")
          }
          value={form.walletId}
          onChange={form.changeWalletId}
          error={form.errors.wallet}
          emptyLabel={t("newTransaction.noWallets")}
        />

        {isTransfer ? (
          <>
            <WalletSelect
              label={t("newTransaction.toWalletLabel")}
              value={form.toWalletId}
              onChange={form.changeToWalletId}
              excludeId={form.walletId}
              error={form.errors.toWallet}
              emptyLabel={t("newTransaction.noOtherWallets")}
            />

            <TextField
              label={t("newTransaction.feeLabel")}
              value={form.fee}
              onChangeText={form.changeFee}
              error={form.errors.fee}
              placeholder={t("newTransaction.feePlaceholder")}
              keyboardType="number-pad"
            />
          </>
        ) : null}

        {categoryType ? (
          <CategoryPicker
            type={categoryType}
            value={form.categoryId}
            onChange={form.changeCategoryId}
            error={form.errors.category}
          />
        ) : null}

        <DateField
          label={t("newTransaction.dateLabel")}
          value={form.occurredAt}
          onChange={form.changeOccurredAt}
        />

        {isBill ? (
          <DateField
            label={t("newTransaction.dueDateLabel")}
            value={form.dueDate}
            onChange={form.changeDueDate}
            placeholder={t("newTransaction.dueDatePlaceholder")}
          />
        ) : null}

        <TextField
          label={t("newTransaction.noteLabel")}
          value={form.note}
          onChangeText={form.changeNote}
          error={form.errors.note}
          placeholder={t("newTransaction.notePlaceholder")}
          maxLength={200}
          multiline
          size="multiline"
          textAlignVertical="top"
        />

        {form.errors.form ? (
          <Text className="text-sm text-danger">{form.errors.form}</Text>
        ) : null}

        <Button
          label={t("newTransaction.submit")}
          isLoading={form.isSubmitting}
          onPress={form.submit}
        />
      </View>
    </View>
  );
}
