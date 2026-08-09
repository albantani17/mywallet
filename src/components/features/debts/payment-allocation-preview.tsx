import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import type { InstallmentWithPaid } from "@/db";
import { useActiveLocale } from "@/hooks/use-active-locale";
import type { AllocationInput } from "@/services/payment-allocator";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

type PaymentAllocationPreviewProps = {
  allocations: AllocationInput[];
  installments: InstallmentWithPaid[];
  allocated: number;
  unallocated: number;
  currency: string;
};

/**
 * Where this payment is about to land.
 *
 * Shown before the confirm button because a split the user cannot see is a
 * split they cannot correct — and the rows here are the ones the service will
 * write, computed by the same function.
 */
export function PaymentAllocationPreview({
  allocations,
  installments,
  allocated,
  unallocated,
  currency,
}: PaymentAllocationPreviewProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const byId = new Map(installments.map((installment) => [installment.id, installment]));
  const money = (value: number) => formatCurrency(value, locale, currency);

  return (
    <View className="flex-col gap-2 rounded-2xl bg-elevated p-4">
      <Text className="text-sm font-semibold text-fg">
        {allocations.length > 0
          ? t("newPayment.covers", {
              sequences: allocations
                .map((allocation) => `#${byId.get(allocation.installmentId)?.sequence ?? "?"}`)
                .join(", "),
            })
          : t("newPayment.coversNone")}
      </Text>

      {allocations.map((allocation) => {
        const installment = byId.get(allocation.installmentId);
        return (
          <View
            key={allocation.installmentId}
            className="flex-row items-center gap-3"
          >
            <Text className="w-8 text-[11px] font-semibold text-fg-muted">
              #{installment?.sequence ?? "?"}
            </Text>
            <Text className="flex-1 text-xs text-fg-muted" numberOfLines={1}>
              {installment?.dueDate
                ? formatDate(installment.dueDate, locale)
                : t("debtDetail.noDueDate")}
            </Text>
            <Text className="text-xs font-medium text-fg">
              {money(allocation.amount)}
            </Text>
          </View>
        );
      })}

      <Text className="text-[11px] text-fg-muted">
        {t("newPayment.allocated", { amount: money(allocated) })}
      </Text>

      {/* Never hidden, never blocking: rounding a Rp 95.000 debt up to
          Rp 100.000 is ordinary, but money that reaches no installment is
          exactly how a total drifts unnoticed. */}
      {unallocated > 0 ? (
        <Text className="text-[11px] text-fg-muted">
          {t("newPayment.unallocated", { amount: money(unallocated) })}
        </Text>
      ) : null}
    </View>
  );
}
