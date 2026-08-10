import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { useActiveLocale } from "@/hooks/use-active-locale";
import type { GeneratedInstallment } from "@/services/schedule-generator";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

type InstallmentPreviewListProps = { installments: GeneratedInstallment[] };

/**
 * A mortgage runs to 180 rows. Showing them all would cost the wizard its
 * scroll performance to tell the user nothing they cannot infer from the first
 * dozen and the totals underneath.
 */
const PREVIEW_LIMIT = 12;

/**
 * The rows this debt would create, exactly as the generator produced them.
 *
 * The point is comparison: the user holds a schedule from the lender, and this
 * is where a mismatch shows up — while it can still be corrected, before
 * anything is written.
 *
 * A plain column rather than a FlatList: this lives inside the wizard's
 * ScrollView, and a nested virtualised list there scrolls against its parent.
 */
export function InstallmentPreviewList({
  installments,
}: InstallmentPreviewListProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  if (installments.length === 0) {
    return (
      <Text className="text-sm text-fg-muted">{t("newDebt.previewEmpty")}</Text>
    );
  }

  const shown = installments.slice(0, PREVIEW_LIMIT);
  const hidden = installments.length - shown.length;

  return (
    <View className="flex-col">
      {shown.map((installment) => (
        <View
          key={installment.sequence}
          className="flex-row items-center gap-3 py-2"
        >
          <Text className="w-8 text-xs font-semibold text-fg-muted">
            #{installment.sequence}
          </Text>

          <Text className="flex-1 text-sm text-fg" numberOfLines={1}>
            {installment.dueDate
              ? formatDate(installment.dueDate, locale)
              : t("newDebt.previewNoDate")}
          </Text>

          <View className="flex-col items-end">
            <Text className="text-sm font-semibold text-fg">
              {formatCurrency(installment.totalAmount, locale)}
            </Text>
            {installment.interestAmount ? (
              <Text className="text-[11px] text-fg-muted">
                {t("newDebt.previewInterest")}{" "}
                {formatCurrency(installment.interestAmount, locale)}
              </Text>
            ) : null}
          </View>
        </View>
      ))}

      {hidden > 0 ? (
        <Text className="pt-1 text-xs text-fg-muted">
          {t("newDebt.previewMore", { count: hidden })}
        </Text>
      ) : null}
    </View>
  );
}
