import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { WalletWithBalance } from "@/db";
import { useDeleteWallet } from "@/hooks/features/wallets/use-delete-wallet";
import type { RemoveWalletResult } from "@/services/wallet-service";

type WalletDeleteSheetProps = {
  wallet: WalletWithBalance;
  isOpen: boolean;
  onClose: () => void;
  onRemoved: (result: RemoveWalletResult) => void;
};

export function WalletDeleteSheet({
  wallet,
  isOpen,
  onClose,
  onRemoved,
}: WalletDeleteSheetProps) {
  const { t } = useTranslation();
  const {
    step,
    typedName,
    setTypedName,
    error,
    isSubmitting,
    hasUsage,
    usageCount,
    isNameConfirmed,
    confirm,
  } = useDeleteWallet(wallet, onRemoved);

  const isNameStep = hasUsage && step === "typeName";

  // A used wallet is archived, not erased — the copy has to say so rather than
  // promising a deletion that never happens.
  const title = hasUsage
    ? t("wallets.delete.usedTitle", { name: wallet.name })
    : t("wallets.delete.title", { name: wallet.name });

  const confirmLabel = hasUsage
    ? step === "confirm"
      ? t("wallets.delete.continue")
      : t("wallets.delete.archiveConfirm")
    : t("wallets.delete.confirm");

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-4">
        <View className="flex-row items-center gap-3">
          <View className="size-10 flex-col items-center justify-center rounded-full bg-red-100">
            <Ionicons
              name={hasUsage ? "eye-off-outline" : "trash-outline"}
              size={20}
              color="#dc2626"
            />
          </View>
          <Text className="flex-1 text-lg font-bold text-brand-logo-fg">
            {title}
          </Text>
        </View>

        <Text className="text-sm leading-5 text-brand-sheet-muted">
          {hasUsage
            ? t("wallets.delete.usedMessage", { count: usageCount })
            : t("wallets.delete.message")}
        </Text>

        {isNameStep ? (
          <View className="flex-col gap-2">
            <Text className="text-sm text-brand-logo-fg">
              {t("wallets.delete.typeNamePrompt", { name: wallet.name })}
            </Text>
            <TextField
              value={typedName}
              onChangeText={setTypedName}
              placeholder={t("wallets.delete.typeNamePlaceholder")}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : null}

        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

        <View className="mt-1 flex-row justify-end gap-3">
          <Button
            variant="ghost"
            label={t("wallets.actions.cancel")}
            isDisabled={isSubmitting}
            onPress={onClose}
          />
          <Button
            variant="destructive"
            label={confirmLabel}
            // The name step stays inert until the typed name matches exactly.
            isDisabled={isNameStep && !isNameConfirmed}
            isLoading={isSubmitting}
            onPress={confirm}
            className="px-6"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
