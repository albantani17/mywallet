import { useTranslation } from "react-i18next";
import { Pressable, Switch, Text, View } from "react-native";

import { DateField } from "@/components/features/transactions/date-field";
import { WalletSelect } from "@/components/features/transactions/wallet-select";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { DebtDirection } from "@/db";
import { useCreateDebt } from "@/hooks/features/debts/use-create-debt";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency } from "@/utils/format-currency";

import { CounterpartyField } from "./counterparty-field";
import { DebtAdvancedDetails } from "./debt-advanced-details";
import { DebtDirectionTabs } from "./debt-direction-tabs";
import { formatBpsAsPercent, interestFor } from "./debt-draft";
import { DebtPaymentPlanField } from "./debt-payment-plan-field";
import { DebtPresetSelect } from "./debt-preset-select";
import { InstallmentPreviewList } from "./installment-preview-list";

type DebtFormProps = {
  initialDirection: DebtDirection;
  onSaved: () => void;
};

/**
 * The add-debt form, on one screen.
 *
 * This used to be a three-step wizard. The steps made sense when the middle one
 * asked for an interest rate, a method, a grace period and a rounding unit —
 * ten fields nobody recording a paylater instalment has answers for. Once those
 * moved behind "advanced" and the schedule became "how much, how many times",
 * there was not enough left to fill three screens, and the split only hid the
 * preview two taps away from the numbers it was meant to check.
 *
 * Nothing is written until submit, so abandoning the form leaves no trace.
 */
export function DebtForm({ initialDirection, onSaved }: DebtFormProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();
  const form = useCreateDebt(initialDirection, onSaved);
  const { draft, errors, preview } = form;

  const billed = preview.reduce((sum, row) => sum + row.totalAmount, 0);
  const interest = preview.reduce(
    (sum, row) => sum + (row.interestAmount ?? 0),
    0,
  );
  const rateBps = interestFor(draft).interestRateBps;

  return (
    <View className="flex-col gap-5 px-6">
      <View className="flex-col gap-5 rounded-3xl bg-surface p-5">
        <View className="flex-col gap-1.5">
          <Text className="text-sm font-medium text-fg">
            {t("newDebt.directionLabel")}
          </Text>
          <DebtDirectionTabs
            value={draft.direction}
            onChange={(direction) => form.change("direction", direction)}
          />
        </View>

        <DebtPresetSelect
          direction={draft.direction}
          value={draft.presetSlug}
          onChange={form.choosePreset}
        />

        <CounterpartyField
          name={draft.counterpartyName}
          kind={draft.counterpartyKind}
          selectedId={draft.counterpartyId}
          error={errors.counterpartyName}
          onChangeName={form.changeCounterpartyName}
          onSelect={form.chooseCounterparty}
        />

        <TextField
          label={t("newDebt.titleLabel")}
          placeholder={t("newDebt.titlePlaceholder")}
          value={draft.title}
          onChangeText={(value) => form.change("title", value)}
          error={errors.title}
          maxLength={150}
        />

        <TextField
          label={t("newDebt.principalLabel")}
          placeholder={t("newDebt.principalPlaceholder")}
          value={form.principal}
          onChangeText={form.changePrincipal}
          error={errors.principal}
          keyboardType="number-pad"
          size="large"
        />

        <DateField
          label={t("newDebt.originDateLabel")}
          value={draft.originDate}
          onChange={(value) => form.change("originDate", value)}
        />
      </View>

      <View className="flex-col gap-5 rounded-3xl bg-surface p-5">
        <DebtPaymentPlanField form={form} />
      </View>

      <View className="flex-col gap-5 rounded-3xl bg-surface p-5">
        <View className="flex-col gap-1.5">
          <WalletSelect
            label={t("newDebt.walletLabel")}
            value={draft.walletId}
            onChange={(walletId) => form.change("walletId", walletId)}
            emptyLabel={t("newDebt.noWallets")}
          />
          <Text className="text-xs text-fg-muted">
            {t("newDebt.walletHint")}
          </Text>
        </View>

        {/* Only offered once a wallet is chosen — there is nothing for the cash
            flow to move otherwise, and the service ignores the flag anyway. */}
        {draft.walletId !== null ? (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: draft.recordCashFlow }}
            onPress={() => form.change("recordCashFlow", !draft.recordCashFlow)}
            className="flex-row items-center gap-3 rounded-2xl bg-elevated p-4 active:opacity-70"
          >
            <View className="flex-1 flex-col">
              <Text className="text-sm font-medium text-fg">
                {t("newDebt.recordCashFlowLabel")}
              </Text>
              <Text className="mt-0.5 text-xs text-fg-muted">
                {t("newDebt.recordCashFlowHint")}
              </Text>
            </View>

            <Switch
              value={draft.recordCashFlow}
              onValueChange={(value) => form.change("recordCashFlow", value)}
              trackColor={{ false: colors.line, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </Pressable>
        ) : null}

        <DebtAdvancedDetails form={form} />
      </View>

      {/* The preview runs the same functions the service will, so what is
          checked here is what gets written. It stays on this screen rather than
          behind a confirm sheet: the user is comparing it against the lender's
          own figures, and that comparison has to happen next to the fields
          being corrected. */}
      <View className="flex-col gap-3 rounded-3xl bg-surface p-5">
        <Text className="text-sm font-bold text-fg">
          {t("newDebt.previewTitle")}
        </Text>

        <InstallmentPreviewList installments={preview} />

        {preview.length > 0 ? (
          <View className="flex-col gap-1 border-t border-line pt-3">
            <SummaryRow
              label={t("newDebt.previewTotal")}
              value={formatCurrency(billed, locale)}
            />
            {interest > 0 ? (
              <SummaryRow
                label={t("newDebt.previewInterest")}
                value={`${formatCurrency(interest, locale)}${
                  rateBps > 0
                    ? ` · ${t("newDebt.previewRateEquivalent", {
                        rate: formatBpsAsPercent(rateBps),
                      })}`
                    : ""
                }`}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      {errors.form ? (
        <Text className="text-sm text-danger">{errors.form}</Text>
      ) : null}

      <Button
        label={t("newDebt.submit")}
        onPress={form.submit}
        isLoading={form.isSubmitting}
      />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-xs text-fg-muted">{label}</Text>
      <Text className="flex-1 text-right text-xs font-medium text-fg">
        {value}
      </Text>
    </View>
  );
}
