import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { TINT_ALPHA } from "@/components/features/shared/icon-choices";
import type { FrequentTransaction } from "@/db";
import { useFrequentTransactions } from "@/hooks/features/transactions/use-frequent-transactions";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { formatCurrency } from "@/utils/format-currency";

import {
  BUILT_IN_LABEL_KEYS,
  FALLBACK_COLOR,
  toIconName,
} from "./transaction-category";

type QuickRepeatStripProps = {
  onRepeat: (suggestion: FrequentTransaction, label: string) => void;
};

/**
 * One tap to record something already recorded before.
 *
 * Most personal spending is a short list of the same purchases, so this is the
 * fastest path in the app and deliberately the first thing under the wallets:
 * open, tap, done.
 */
export function QuickRepeatStrip({ onRepeat }: QuickRepeatStripProps) {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const router = useRouter();
  const { suggestions, isReady } = useFrequentTransactions();

  // Nothing to suggest yet, and no empty state either: an explanatory card for
  // a feature that turns itself on is just noise on a first-run dashboard.
  if (!isReady || suggestions.length === 0) return null;

  // Built-ins keep their translated label; a category the user typed shows the
  // name they typed. Same rule as the row and the pickers.
  const labelOf = (suggestion: FrequentTransaction): string => {
    if (suggestion.note?.trim()) return suggestion.note.trim();

    const builtInKey =
      suggestion.categoryIsBuiltIn && suggestion.categorySlug
        ? BUILT_IN_LABEL_KEYS[
            suggestion.categorySlug as keyof typeof BUILT_IN_LABEL_KEYS
          ]
        : undefined;

    return (
      (builtInKey ? t(builtInKey) : suggestion.categoryName) ??
      t("transactions.uncategorized")
    );
  };

  return (
    <View className="flex-col gap-3">
      <View className="flex-col px-6">
        <Text className="text-lg font-bold text-fg">
          {t("dashboard.quickRepeat.title")}
        </Text>
        <Text className="mt-0.5 text-xs text-fg-muted">
          {t("dashboard.quickRepeat.hint")}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
      >
        {suggestions.map((suggestion) => {
          const label = labelOf(suggestion);
          const tint = suggestion.categoryColor ?? FALLBACK_COLOR;

          return (
            <Pressable
              key={[
                suggestion.type,
                suggestion.walletId,
                suggestion.categoryId,
                suggestion.amount,
                suggestion.note ?? "",
              ].join("|")}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${formatCurrency(suggestion.amount, locale)}`}
              onPress={() => onRepeat(suggestion, label)}
              // The escape hatch for a habit whose amount changed this time.
              // It opens the full form seeded with the same shape rather than
              // a second bespoke editor.
              onLongPress={() =>
                router.push({
                  pathname: "/transaction/new",
                  params: {
                    type: suggestion.type,
                    amount: String(suggestion.amount),
                    walletId: String(suggestion.walletId),
                    ...(suggestion.categoryId === null
                      ? {}
                      : { categoryId: String(suggestion.categoryId) }),
                    ...(suggestion.note ? { note: suggestion.note } : {}),
                  },
                })
              }
              className="w-44 flex-col gap-2 rounded-2xl border border-line bg-surface p-3 active:opacity-70"
            >
              <View className="flex-row items-center gap-2">
                <View
                  className="size-8 flex-col items-center justify-center rounded-full"
                  style={{ backgroundColor: tint + TINT_ALPHA }}
                >
                  <Ionicons
                    name={toIconName(suggestion.categoryIcon)}
                    size={16}
                    color={tint}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  className="flex-1 text-sm font-semibold text-fg"
                >
                  {label}
                </Text>
              </View>

              {/* The amount is deliberately loud: it is what a tap is about to
                  record, so it has to be read first — the confirm sheet shows
                  it again, but the strip is where the choice is made. */}
              <Text numberOfLines={1} className="text-base font-bold text-fg">
                {formatCurrency(suggestion.amount, locale)}
              </Text>
              <Text numberOfLines={1} className="text-xs text-fg-muted">
                {suggestion.walletName ?? ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
