import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, Switch, Text, View } from "react-native";

import { DateField } from "@/components/features/transactions/date-field";
import { WalletSelect } from "@/components/features/transactions/wallet-select";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { TextField } from "@/components/ui/text-field";
import {
  PAYMENT_METHODS,
  type DebtWithSummary,
  type InstallmentWithPaid,
  type PaymentMethod,
} from "@/db";
import { useRecordPayment } from "@/hooks/features/debts/use-record-payment";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import type { DebtProgress, DueBreakdown } from "@/services/debt-status";
import { formatCurrency } from "@/utils/format-currency";

import { PaymentAllocationEditor } from "./payment-allocation-editor";
import { PaymentAllocationPreview } from "./payment-allocation-preview";
import { PaymentAmountPicks } from "./payment-amount-picks";
import { PaymentDueCard } from "./payment-due-card";

type RecordPaymentFormProps = {
  debt: DebtWithSummary;
  installments: InstallmentWithPaid[];
  progress: DebtProgress;
  due: DueBreakdown;
  installmentAmount: number | null;
  graceDays: number;
  now: Date;
  onSaved: () => void;
};

const METHOD_KEYS = {
  transfer: "debtDetail.paymentMethod.transfer",
  cash: "debtDetail.paymentMethod.cash",
  autodebit: "debtDetail.paymentMethod.autodebit",
  other: "debtDetail.paymentMethod.other",
} as const;

export function RecordPaymentForm({
  debt,
  installments,
  progress,
  due,
  installmentAmount,
  graceDays,
  now,
  onSaved,
}: RecordPaymentFormProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();

  const outstanding = progress.outstanding;

  const form = useRecordPayment(
    { debtId: debt.id, installments, suggestedAmount: due.suggestedAmount },
    onSaved,
  );

  const money = (value: number) => formatCurrency(value, locale, debt.currency);
  const remainingAfter = Math.max(outstanding - (form.amountValue ?? 0), 0);

  return (
    <View className="flex-col gap-5">
      <View className="mx-6 flex-col gap-1 rounded-3xl bg-primary-soft p-5">
        <Text className="text-sm text-fg-muted">
          {debt.direction === "payable"
            ? t("newPayment.outstandingPayable")
            : t("newPayment.outstandingReceivable", {
                name: debt.counterpartyName ?? "—",
              })}
        </Text>
        <Text className="text-2xl font-extrabold text-fg" adjustsFontSizeToFit>
          {money(outstanding)}
        </Text>
        <Text className="text-xs text-fg-muted">{debt.title}</Text>
      </View>

      <PaymentDueCard
        due={due}
        progress={progress}
        counterpartyKind={debt.counterpartyKind}
        installmentAmount={installmentAmount}
        graceDays={graceDays}
        now={now}
        currency={debt.currency}
      />

      <View className="mx-6 flex-col gap-5 rounded-3xl bg-surface p-6">
        <View className="flex-col gap-1.5">
          <TextField
            label={t("newPayment.amountLabel")}
            placeholder={t("newPayment.amountPlaceholder")}
            value={form.amount}
            onChangeText={form.changeAmount}
            error={form.errors.amount}
            keyboardType="number-pad"
            size="large"
          />
          <PaymentAmountPicks
            due={due}
            outstanding={outstanding}
            currency={debt.currency}
            selected={form.amountValue}
            onPick={form.pickAmount}
          />

          <Text className="text-xs text-fg-muted">
            {remainingAfter === 0
              ? t("newPayment.willSettle")
              : t("newPayment.willRemain", { amount: money(remainingAfter) })}
          </Text>
        </View>

        <DateField
          label={t("newPayment.dateLabel")}
          value={form.paidAt}
          onChange={form.changePaidAt}
        />

        <View className="flex-col gap-1.5">
          <WalletSelect
            label={t(
              debt.direction === "payable"
                ? "newPayment.walletLabelPayable"
                : "newPayment.walletLabelReceivable",
            )}
            value={form.walletId}
            onChange={form.changeWalletId}
            emptyLabel={t("newPayment.noWallets")}
          />
          <Text className="text-xs text-fg-muted">
            {t("newPayment.walletHint")}
          </Text>
        </View>

        <View className="flex-col gap-1.5">
          <Text className="text-sm font-medium text-fg">
            {t("newPayment.methodLabel")}
          </Text>

          <DropdownMenu
            items={[
              {
                key: "none",
                label: t("newPayment.methodUnspecified"),
                onPress: () => form.changeMethod(null),
              },
              ...PAYMENT_METHODS.map((method: PaymentMethod) => ({
                key: method,
                label: t(METHOD_KEYS[method]),
                onPress: () => form.changeMethod(method),
              })),
            ]}
            selectedKey={form.method ?? "none"}
            matchTriggerWidth
            accessibilityLabel={t("newPayment.methodLabel")}
            trigger={
              <View className="h-12 flex-row items-center gap-2 rounded-xl border border-line bg-elevated px-4">
                <Text className="flex-1 text-base text-fg">
                  {form.method
                    ? t(METHOD_KEYS[form.method])
                    : t("newPayment.methodUnspecified")}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.fgMuted} />
              </View>
            }
          />
        </View>

        {/* Only offered with a wallet chosen: without one there is nothing for
            the cash flow to move, and the service ignores the flag anyway. */}
        {form.walletId !== null ? (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: form.recordCashFlow }}
            onPress={() => form.changeRecordCashFlow(!form.recordCashFlow)}
            className="flex-row items-center gap-3 rounded-2xl bg-elevated p-4 active:opacity-70"
          >
            <View className="flex-1 flex-col">
              <Text className="text-sm font-medium text-fg">
                {t("newPayment.cashFlowLabel")}
              </Text>
              <Text className="mt-0.5 text-xs text-fg-muted">
                {t("newPayment.cashFlowHint")}
              </Text>
            </View>

            <Switch
              value={form.recordCashFlow}
              onValueChange={form.changeRecordCashFlow}
              trackColor={{ false: colors.line, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </Pressable>
        ) : null}

        <TextField
          label={t("newPayment.noteLabel")}
          placeholder={t("newPayment.notePlaceholder")}
          value={form.note}
          onChangeText={form.changeNote}
          error={form.errors.note}
          maxLength={200}
        />
      </View>

      <View className="mx-6 flex-col gap-3 rounded-3xl bg-surface p-6">
        <Text className="text-sm font-bold text-fg">
          {t("newPayment.allocationTitle")}
        </Text>

        <PaymentAllocationPreview
          allocations={form.allocations}
          installments={installments}
          allocated={form.allocated}
          unallocated={form.unallocated}
          currency={debt.currency}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: form.isManualOpen }}
          onPress={form.toggleManual}
          className="flex-row items-center gap-2 active:opacity-70"
        >
          <Ionicons
            name={form.isManualOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.fgMuted}
          />
          <Text className="text-sm font-medium text-fg-muted">
            {t("newPayment.manualToggle")}
          </Text>
        </Pressable>

        {form.isManualOpen ? (
          <PaymentAllocationEditor
            form={form}
            installments={installments}
            currency={debt.currency}
          />
        ) : null}
      </View>

      <View className="mx-6 flex-col gap-3">
        {form.errors.form ? (
          <Text className="text-sm text-danger">{form.errors.form}</Text>
        ) : null}

        <Button
          label={t("newPayment.submit")}
          isLoading={form.isSubmitting}
          onPress={form.submit}
        />
      </View>
    </View>
  );
}
