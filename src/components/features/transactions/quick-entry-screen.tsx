import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { TransactionType } from "@/db";
import {
  useQuickEntry,
  type QuickEntryField,
} from "@/hooks/features/transactions/use-quick-entry";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatCurrency, parseAmountInput } from "@/utils/format-currency";
import { cn } from "@/utils/cn";

import { CategorySelect } from "./category-select";
import { DateField } from "./date-field";
import { TransactionTypeSelect } from "./transaction-type-select";
import { WalletSelect } from "./wallet-select";
import { useTransactionCategories } from "@/hooks/features/transactions/use-transaction-categories";
import { useWallets } from "@/hooks/features/wallets/use-wallets";
import { formatDate } from "@/utils/format-date";

const TYPE_LABEL_KEYS = {
  expense: "newTransaction.types.expense",
  income: "newTransaction.types.income",
  transfer: "newTransaction.types.transfer",
  bill: "newTransaction.types.bill",
} as const;

/**
 * Free-text entry with its interpretation shown before anything is saved.
 *
 * There is no syntax to learn: the sentence is parsed as it is typed and every
 * field it produced is on screen as a chip. Fields the parser inferred rather
 * than read are marked, and any chip can be tapped to correct it — which is
 * also the only way an alias is ever proposed.
 *
 * A screen rather than a sheet so the wallet and category pickers, which are
 * modals of their own, open over it the way they do on the full form.
 */
export function QuickEntryScreen() {
  const { t } = useTranslation();
  const { locale } = useActiveLocale();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const entry = useQuickEntry();
  const [editing, setEditing] = useState<QuickEntryField | null>(null);

  const { wallets } = useWallets();
  const categoryType = entry.draft.type === "transfer" ? null : entry.draft.type;
  const { resolved: categories } = useTransactionCategories(categoryType ?? "expense");

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/home");
  }, []);

  const isGuessed = (field: QuickEntryField) => entry.draft.guessed.includes(field);
  const toggle = (field: QuickEntryField) =>
    setEditing((current) => (current === field ? null : field));

  const walletName = (id: number | null) =>
    wallets.find((wallet) => wallet.id === id)?.name ?? null;
  const categoryLabel =
    categories.find((category) => category.id === entry.draft.categoryId)?.label ?? null;

  return (
    <View className="flex-1 flex-col bg-canvas">
      <View
        className="flex-row items-center gap-3 px-6 pb-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("newTransaction.close")}
          onPress={close}
          hitSlop={8}
          className="size-10 flex-col items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          <Ionicons name="close" size={22} color={colors.fg} />
        </Pressable>
        <Text className="text-xl font-extrabold text-fg">
          {t("quickEntry.title")}
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mx-6 flex-col gap-5 rounded-3xl bg-surface p-6">
            <TextField
              value={entry.text}
              onChangeText={entry.changeText}
              placeholder={t("quickEntry.placeholder")}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
            <Text className="-mt-3 text-xs text-fg-muted">
              {t("quickEntry.hint")}
            </Text>

            <View className="flex-col gap-2">
              <Text className="text-sm font-medium text-fg">
                {t("quickEntry.interpretation")}
              </Text>

              <View className="flex-row flex-wrap gap-2">
                <Chip
                  label={t(TYPE_LABEL_KEYS[entry.draft.type])}
                  isGuessed={isGuessed("type")}
                  isOpen={editing === "type"}
                  onPress={() => toggle("type")}
                />
                <Chip
                  label={
                    entry.draft.amount === null
                      ? t("quickEntry.amountUnknown")
                      : formatCurrency(entry.draft.amount, locale)
                  }
                  isGuessed={isGuessed("amount")}
                  isOpen={editing === "amount"}
                  onPress={() => toggle("amount")}
                />
                <Chip
                  label={walletName(entry.draft.walletId) ?? t("quickEntry.walletUnknown")}
                  isGuessed={isGuessed("wallet")}
                  isOpen={editing === "wallet"}
                  onPress={() => toggle("wallet")}
                />
                {entry.draft.type === "transfer" ? (
                  <Chip
                    label={
                      walletName(entry.draft.toWalletId) ?? t("quickEntry.walletUnknown")
                    }
                    isGuessed={entry.draft.toWalletId === null}
                    isOpen={editing === "category"}
                    onPress={() => toggle("category")}
                  />
                ) : (
                  <Chip
                    label={categoryLabel ?? t("quickEntry.categoryUnknown")}
                    isGuessed={isGuessed("category")}
                    isOpen={editing === "category"}
                    onPress={() => toggle("category")}
                  />
                )}
                <Chip
                  label={formatDate(entry.draft.occurredAt, locale)}
                  isGuessed={isGuessed("date")}
                  isOpen={editing === "date"}
                  onPress={() => toggle("date")}
                />
              </View>

              {entry.draft.guessed.length > 0 ? (
                <Text className="text-xs text-fg-muted">
                  {t("quickEntry.guessedHint")}
                </Text>
              ) : null}
            </View>

            {/* One editor at a time: the point of this screen is that the whole
                interpretation fits on it without scrolling. */}
            {editing === "type" ? (
              <TransactionTypeSelect
                value={entry.draft.type}
                onChange={(type: TransactionType) => entry.override("type", type)}
              />
            ) : null}

            {editing === "amount" ? (
              <TextField
                label={t("quickEntry.fields.amount")}
                value={entry.draft.amount === null ? "" : String(entry.draft.amount)}
                onChangeText={(value) =>
                  entry.override("amount", parseAmountInput(value))
                }
                keyboardType="number-pad"
                size="large"
              />
            ) : null}

            {editing === "wallet" ? (
              <WalletSelect
                label={t("quickEntry.fields.wallet")}
                value={entry.draft.walletId}
                onChange={(walletId) => entry.override("walletId", walletId)}
                emptyLabel={t("newTransaction.noWallets")}
              />
            ) : null}

            {editing === "category" ? (
              entry.draft.type === "transfer" ? (
                <WalletSelect
                  label={t("quickEntry.fields.toWallet")}
                  value={entry.draft.toWalletId}
                  onChange={(walletId) => entry.override("toWalletId", walletId)}
                  excludeId={entry.draft.walletId}
                  emptyLabel={t("newTransaction.noOtherWallets")}
                />
              ) : categoryType ? (
                <CategorySelect
                  type={categoryType}
                  value={entry.draft.categoryId}
                  onChange={(categoryId) => entry.override("categoryId", categoryId)}
                  isOptional
                />
              ) : null
            ) : null}

            {editing === "date" ? (
              <DateField
                label={t("quickEntry.fields.date")}
                value={entry.draft.occurredAt}
                onChange={(date) => entry.override("occurredAt", date)}
              />
            ) : null}

            {/* Learning is opt-in and visible. A silent bind cannot be undone
                by someone who does not know the feature exists. */}
            {entry.aliasProposal && entry.aliasTargetLabel ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: entry.shouldLearn }}
                onPress={() => entry.setShouldLearn(!entry.shouldLearn)}
                className="flex-row items-center gap-3 rounded-2xl bg-elevated px-4 py-3 active:opacity-70"
              >
                <Ionicons
                  name={entry.shouldLearn ? "checkbox" : "square-outline"}
                  size={20}
                  color={entry.shouldLearn ? colors.primary : colors.fgMuted}
                />
                <Text className="flex-1 text-sm text-fg">
                  {t("quickEntry.remember", {
                    phrase: entry.aliasProposal.phrase,
                    target: entry.aliasTargetLabel,
                  })}
                </Text>
              </Pressable>
            ) : null}

            {entry.error ? (
              <Text className="text-sm text-danger">{entry.error}</Text>
            ) : null}

            <Button
              label={t("quickEntry.save")}
              isLoading={entry.isSubmitting}
              onPress={() => entry.submit(close)}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.replace({
                  pathname: "/transaction/new",
                  params: {
                    type: entry.draft.type,
                    ...(entry.draft.amount === null
                      ? {}
                      : { amount: String(entry.draft.amount) }),
                    ...(entry.draft.walletId === null
                      ? {}
                      : { walletId: String(entry.draft.walletId) }),
                    ...(entry.draft.categoryId === null
                      ? {}
                      : { categoryId: String(entry.draft.categoryId) }),
                    ...(entry.draft.note ? { note: entry.draft.note } : {}),
                  },
                })
              }
              className="self-center active:opacity-70"
            >
              <Text className="text-sm font-semibold text-primary">
                {t("quickEntry.openFullForm")}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

type ChipProps = {
  label: string;
  isGuessed: boolean;
  isOpen: boolean;
  onPress: () => void;
};

/**
 * One field of the interpretation.
 *
 * Guessed fields are outlined in the warning colour rather than hidden behind
 * a confidence score: the user needs to know which parts to read before they
 * save, and a number would not tell them that.
 */
function Chip({ label, isGuessed, isOpen, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-1.5 rounded-full border px-3 py-2 active:opacity-70",
        isOpen
          ? "border-primary bg-primary-soft"
          : isGuessed
            ? "border-warning bg-warning-soft"
            : "border-line bg-elevated",
      )}
    >
      <Text className="text-sm font-medium text-fg">{label}</Text>
    </Pressable>
  );
}
