import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { DateField } from "@/components/features/transactions/date-field";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { InstallmentWithPaid } from "@/db";
import { useEditInstallment } from "@/hooks/features/debts/use-edit-installment";

type InstallmentEditSheetProps = {
  installment: InstallmentWithPaid;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Correcting one installment.
 *
 * The date and the amount are the two things a lender actually changes — a
 * restructure, a late fee — and both survive a regenerate afterwards, because
 * the service marks the row modified.
 */
export function InstallmentEditSheet({
  installment,
  isOpen,
  onClose,
}: InstallmentEditSheetProps) {
  const { t } = useTranslation();
  const form = useEditInstallment(installment, onClose);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-5">
        <Text className="text-xl font-bold text-fg">
          {t("debtDetail.editInstallment.title", {
            sequence: installment.sequence,
          })}
        </Text>

        <DateField
          label={t("debtDetail.editInstallment.dateLabel")}
          value={form.dueDate}
          onChange={form.changeDueDate}
        />

        <TextField
          label={t("debtDetail.editInstallment.amountLabel")}
          value={form.amount}
          onChangeText={form.changeAmount}
          error={form.errors.amount}
          keyboardType="number-pad"
        />

        <TextField
          label={t("debtDetail.editInstallment.noteLabel")}
          placeholder={t("debtDetail.editInstallment.notePlaceholder")}
          value={form.note}
          onChangeText={form.changeNote}
          error={form.errors.note}
          maxLength={500}
        />

        {form.errors.form ? (
          <Text className="text-sm text-danger">{form.errors.form}</Text>
        ) : null}

        <View className="flex-row justify-end gap-3">
          <Button
            label={t("debtDetail.confirm.cancelAction")}
            variant="ghost"
            isDisabled={form.isSubmitting}
            onPress={onClose}
          />
          <Button
            label={t("debtDetail.editInstallment.save")}
            isLoading={form.isSubmitting}
            onPress={form.submit}
            className="px-6"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
