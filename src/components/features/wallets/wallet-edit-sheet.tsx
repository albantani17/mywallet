import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import type { WalletWithBalance } from "@/db";
import { useEditWallet } from "@/hooks/features/wallets/use-edit-wallet";

import { WalletTypePicker } from "./wallet-type-picker";

type WalletEditSheetProps = {
  wallet: WalletWithBalance;
  isOpen: boolean;
  onClose: () => void;
};

export function WalletEditSheet({
  wallet,
  isOpen,
  onClose,
}: WalletEditSheetProps) {
  const { t } = useTranslation();
  const {
    name,
    type,
    initialBalance,
    errors,
    isSubmitting,
    hasUsage,
    usageCount,
    changeName,
    changeInitialBalance,
    changeType,
    submit,
  } = useEditWallet(wallet, onClose);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-5">
        <Text className="text-xl font-bold text-brand-logo-fg">
          {t("wallets.edit.title")}
        </Text>

        <TextField
          label={t("createWallet.nameLabel")}
          value={name}
          onChangeText={changeName}
          error={errors.name}
          placeholder={t("createWallet.namePlaceholder")}
          maxLength={50}
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {hasUsage ? (
          // Type and opening balance are locked: changing either would move
          // historical balances without touching a single transaction.
          <View className="flex-row items-start gap-2 rounded-2xl bg-black/5 p-3">
            <Text className="flex-1 text-xs leading-4 text-brand-sheet-muted">
              {t("wallets.edit.lockedNote", { count: usageCount })}
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-col gap-2">
              <Text className="text-sm font-medium text-brand-logo-fg">
                {t("createWallet.typeLabel")}
              </Text>
              <WalletTypePicker value={type} onChange={changeType} />
            </View>

            <TextField
              label={t("createWallet.initialBalanceLabel")}
              value={initialBalance}
              onChangeText={changeInitialBalance}
              error={errors.initialBalance}
              placeholder={t("createWallet.initialBalancePlaceholder")}
              keyboardType="number-pad"
            />
          </>
        )}

        {errors.form ? (
          <Text className="text-sm text-red-500">{errors.form}</Text>
        ) : null}

        <View className="flex-row justify-end gap-3">
          <Button
            variant="ghost"
            label={t("wallets.actions.cancel")}
            isDisabled={isSubmitting}
            onPress={onClose}
          />
          <Button
            label={t("wallets.edit.save")}
            isLoading={isSubmitting}
            onPress={submit}
            className="px-7"
          />
        </View>
      </View>
    </BottomSheet>
  );
}
