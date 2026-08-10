import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text } from "react-native";

import { useActiveLocale } from "@/hooks/use-active-locale";
import type { DueBreakdown } from "@/services/debt-status";
import { formatCurrency } from "@/utils/format-currency";

type PaymentAmountPicksProps = {
  due: DueBreakdown;
  outstanding: number;
  currency: string;
  /** The amount in the field, so the matching chip can read as chosen. */
  selected: number | null;
  onPick: (value: number) => void;
};

/**
 * The three amounts anyone actually pays: what is due, one installment, or the
 * lot. Typing stays available — these only spare the user the arithmetic, and
 * make the difference between the three visible at a glance.
 */
export function PaymentAmountPicks({
  due,
  outstanding,
  currency,
  selected,
  onPick,
}: PaymentAmountPicksProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();

  const money = (value: number) => formatCurrency(value, locale, currency);

  const candidates = [
    { key: "dueNow", label: "newPayment.pickDueNow", value: due.dueNowAmount },
    {
      key: "one",
      label: "newPayment.pickOneInstallment",
      value: due.nextRemaining,
    },
    { key: "settle", label: "newPayment.pickSettle", value: outstanding },
  ] as const;

  // Two chips holding the same figure teach the user nothing and make the row
  // look like a bug — on a single-installment debt all three coincide.
  const seen = new Set<number>();
  const picks = candidates.filter((pick) => {
    if (pick.value <= 0 || seen.has(pick.value)) return false;
    seen.add(pick.value);
    return true;
  });

  if (picks.length < 2) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ gap: 8 }}
    >
      {picks.map((pick) => (
        <Pressable
          key={pick.key}
          accessibilityRole="button"
          accessibilityState={{ selected: pick.value === selected }}
          onPress={() => onPick(pick.value)}
          className={
            pick.value === selected
              ? "rounded-full bg-primary px-3 py-1.5 active:opacity-70"
              : "rounded-full bg-elevated px-3 py-1.5 active:opacity-70"
          }
        >
          <Text
            className={
              pick.value === selected
                ? "text-xs font-semibold text-primary-fg"
                : "text-xs font-semibold text-fg-muted"
            }
          >
            {t(pick.label, { amount: money(pick.value) })}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
