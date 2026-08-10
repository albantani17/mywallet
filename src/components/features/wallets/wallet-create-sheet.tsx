import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BottomSheet } from "@/components/ui/bottom-sheet";

import { CreateWalletForm } from "./create-wallet-form";

type WalletCreateSheetProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Create a wallet from the wallets grid.
 *
 * The first-run gate (CreateWalletScreen) keeps its own full-screen layout;
 * this sheet is the "add another" path, and reuses the same form.
 */
export function WalletCreateSheet({ isOpen, onClose }: WalletCreateSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <View className="flex-col gap-5">
        <Text className="text-xl font-bold text-fg">
          {t("createWallet.sheetTitle")}
        </Text>

        <CreateWalletForm onCreated={onClose} />
      </View>
    </BottomSheet>
  );
}
