import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, SectionList, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { AppRefreshControl } from "@/components/ui/refresh-control";
import { Screen } from "@/components/ui/screen";
import type { InstallmentWithPaid, PaymentWithAllocations } from "@/db";
import { useDebt, useDebtSchedule } from "@/hooks/features/debts/use-debt";
import { useDebtActions } from "@/hooks/features/debts/use-debt-actions";
import { useDebtStatusActions } from "@/hooks/features/debts/use-debt-status-actions";
import { useInstallments } from "@/hooks/features/debts/use-installments";
import { usePayments } from "@/hooks/features/debts/use-payments";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { summarise } from "@/services/debt-status";

import { DebtConfirmSheet } from "./debt-confirm-sheet";
import { DebtDetailHeader } from "./debt-detail-header";
import { DebtDetailMenu } from "./debt-detail-menu";
import { DebtInstallmentRow } from "./debt-installment-row";
import { DebtPaymentRow } from "./debt-payment-row";
import { InstallmentEditSheet } from "./installment-edit-sheet";

type DebtDetailScreenProps = { debtId: number | null };

/**
 * One item of either list. A single `renderItem` serves both sections, which
 * is what lets the whole screen be one virtualised list.
 */
type DetailItem =
  | { kind: "installment"; installment: InstallmentWithPaid }
  | { kind: "payment"; payment: PaymentWithAllocations };

type DetailSection = { key: "installments" | "payments"; title: string; data: DetailItem[] };

/**
 * Everything about one debt: how far along it is, what is still due, and what
 * has been paid.
 *
 * A `SectionList` rather than a ScrollView with two plain columns: a mortgage
 * runs to 180 installments and the payment history has no ceiling either, so
 * virtualisation is the point. (The wizard's preview list is a plain column
 * precisely because it is nested inside a ScrollView and capped at 12 rows.)
 */
export function DebtDetailScreen({ debtId }: DebtDetailScreenProps) {
  const { t } = useTranslation();

  const { debt, now, isReady, isRefreshing, refresh, refreshKey } = useDebt(debtId);
  const { graceDays } = useDebtSchedule(debtId, refreshKey);
  const { installments } = useInstallments(debtId, refreshKey);
  const { payments } = usePayments(debtId, refreshKey);

  const actions = useDebtActions();
  const status = useDebtStatusActions();

  // Summed here rather than read off the debt row: the header and every row
  // must use the same clock and grace period, and the SQL columns use their
  // own `now`.
  const progress = useMemo(
    () => summarise(installments, { graceDays, now }),
    [graceDays, installments, now],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/debts");
  }, []);

  const sections = useMemo<DetailSection[]>(() => {
    const built: DetailSection[] = [
      {
        key: "installments",
        title: t("debtDetail.installmentsTitle"),
        data: installments.map((installment) => ({
          kind: "installment" as const,
          installment,
        })),
      },
    ];

    // Omitted entirely while empty: an empty-state block halfway down a list
    // reads as something having gone wrong.
    if (payments.length > 0) {
      built.push({
        key: "payments",
        title: t("debtDetail.paymentsTitle"),
        data: payments.map((payment) => ({ kind: "payment" as const, payment })),
      });
    }

    return built;
  }, [installments, payments, t]);

  if (!isReady) {
    return (
      <Screen>
        <View className="flex-1 flex-col items-center justify-center">
          <ActivityIndicator colorClassName="accent-fg" />
        </View>
      </Screen>
    );
  }

  if (!debt) {
    return (
      <Screen>
        <DetailHeaderBar title={t("debtDetail.title")} onBack={goBack} />
        <Text className="px-6 text-sm text-fg-muted">{t("debtDetail.notFound")}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <DetailHeaderBar
        title={t("debtDetail.title")}
        onBack={goBack}
        trailing={
          <DebtDetailMenu
            status={debt.status}
            // Mirrors the service's own guard without an extra read: the
            // payments are already on screen.
            canDelete={payments.length === 0}
            onCancel={actions.cancelDebt}
            onWriteOff={actions.writeOffDebt}
            onDelete={actions.deleteDebt}
          />
        }
      />

      <View className="flex-1 flex-col">
        <SectionList
          sections={sections}
          keyExtractor={(item) =>
            item.kind === "installment"
              ? `i-${item.installment.id}`
              : `p-${item.payment.id}`
          }
          renderItem={({ item }) =>
            item.kind === "installment" ? (
              <DebtInstallmentRow
                installment={item.installment}
                counterpartyKind={debt.counterpartyKind}
                graceDays={graceDays}
                now={now}
                currency={debt.currency}
                onEdit={actions.editInstallment}
              />
            ) : (
              <DebtPaymentRow
                payment={item.payment}
                currency={debt.currency}
                onDelete={actions.deletePayment}
              />
            )
          }
          renderSectionHeader={({ section }) => (
            <Text className="bg-canvas pb-2 pt-4 text-sm font-bold text-fg">
              {section.title}
            </Text>
          )}
          ListHeaderComponent={
            <DebtDetailHeader debt={debt} progress={progress} />
          }
          ListEmptyComponent={
            <Text className="text-sm text-fg-muted">
              {t("debtDetail.installmentsEmpty")}
            </Text>
          }
          contentContainerClassName="flex-grow px-6 pb-4"
          ItemSeparatorComponent={() => <View className="h-2" />}
          refreshControl={
            <AppRefreshControl isRefreshing={isRefreshing} onRefresh={refresh} />
          }
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* A cancelled or settled debt takes no more money — the service would
          happily record it, so the button is what enforces this. */}
      {debt.status === "active" ? (
        <View className="flex-col px-6 pb-6">
          <Button
            label={t("debtDetail.recordPayment")}
            onPress={() =>
              router.push({ pathname: "/debts/[id]/pay", params: { id: debt.id } })
            }
          />
        </View>
      ) : null}

      {actions.activeInstallment ? (
        <InstallmentEditSheet
          key={`edit-${actions.activeInstallment.id}`}
          installment={actions.activeInstallment}
          isOpen={actions.isEditInstallmentOpen}
          onClose={actions.close}
        />
      ) : null}

      <DebtConfirmSheet
        kind="cancel"
        isOpen={actions.isCancelOpen}
        error={status.error}
        isSubmitting={status.isSubmitting}
        onConfirm={() => status.closeDebt(debt.id, "cancelled", actions.close)}
        onClose={actions.close}
      />

      <DebtConfirmSheet
        kind="writeOff"
        isOpen={actions.isWriteOffOpen}
        error={status.error}
        isSubmitting={status.isSubmitting}
        onConfirm={() => status.closeDebt(debt.id, "written_off", actions.close)}
        onClose={actions.close}
      />

      <DebtConfirmSheet
        kind="deleteDebt"
        isOpen={actions.isDeleteDebtOpen}
        title={debt.title}
        error={status.error}
        isSubmitting={status.isSubmitting}
        // Replace, not back: the screen standing here no longer has a subject.
        onConfirm={() =>
          status.removeDebt(debt.id, () => router.replace("/debts"))
        }
        onClose={actions.close}
      />

      {actions.activePayment ? (
        <DebtConfirmSheet
          key={`delete-payment-${actions.activePayment.id}`}
          kind="deletePayment"
          isOpen={actions.isDeletePaymentOpen}
          error={status.error}
          isSubmitting={status.isSubmitting}
          onConfirm={() =>
            status.removePayment(
              actions.activePayment?.id as number,
              actions.close,
            )
          }
          onClose={actions.close}
        />
      ) : null}
    </Screen>
  );
}

function DetailHeaderBar({
  title,
  onBack,
  trailing,
}: {
  title: string;
  onBack: () => void;
  trailing?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View className="flex-row items-center gap-3 px-6 pb-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("debtDetail.back")}
        onPress={onBack}
        hitSlop={8}
        className="size-10 flex-col items-center justify-center rounded-full bg-surface active:opacity-70"
      >
        <Ionicons name="chevron-back" size={22} color={colors.fg} />
      </Pressable>

      <Text className="flex-1 text-2xl font-extrabold text-fg">{title}</Text>

      {trailing}
    </View>
  );
}
