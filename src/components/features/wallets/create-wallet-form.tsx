import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useCreateWallet } from "@/hooks/features/wallets/use-create-wallet";

import { WalletTypePicker } from "./wallet-type-picker";

type CreateWalletFormProps = {
  /** Called after the wallet row is committed. */
  onCreated?: () => void;
};

export function CreateWalletForm({ onCreated }: CreateWalletFormProps) {
  const { t } = useTranslation();
  const {
    name,
    type,
    initialBalance,
    errors,
    isSubmitting,
    changeName,
    changeInitialBalance,
    changeType,
    submit,
  } = useCreateWallet(onCreated);

  return (
    <View className="flex-col gap-5">
      <TextField
        label={t("createWallet.nameLabel")}
        value={name}
        onChangeText={changeName}
        error={errors.name}
        placeholder={t("createWallet.namePlaceholder")}
        maxLength={50}
        returnKeyType="next"
      />

      <View className="flex-col gap-2">
        <Text className="text-sm font-medium text-brand-logo-fg">
          {t("createWallet.typeLabel")}
        </Text>
        <WalletTypePicker value={type} onChange={changeType} />
      </View>

      <View className="flex-col gap-1">
        <TextField
          label={t("createWallet.initialBalanceLabel")}
          value={initialBalance}
          onChangeText={changeInitialBalance}
          error={errors.initialBalance}
          placeholder={t("createWallet.initialBalancePlaceholder")}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        {!errors.initialBalance ? (
          <Text className="text-xs text-brand-sheet-muted">
            {t("createWallet.initialBalanceHint")}
          </Text>
        ) : null}
      </View>

      {errors.form ? (
        <Text className="text-sm text-red-500">{errors.form}</Text>
      ) : null}

      <Button
        label={t("createWallet.submit")}
        isLoading={isSubmitting}
        onPress={submit}
      />
    </View>
  );
}
