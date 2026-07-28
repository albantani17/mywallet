import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  DropdownMenu,
  type DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { WalletWithBalance } from "@/db";

type WalletCardMenuProps = {
  wallet: WalletWithBalance;
  onEdit: (wallet: WalletWithBalance) => void;
  onDelete: (wallet: WalletWithBalance) => void;
};

/** Kebab on a grid card, opening Edit / Delete. */
export function WalletCardMenu({
  wallet,
  onEdit,
  onDelete,
}: WalletCardMenuProps) {
  const { t } = useTranslation();

  const items: DropdownMenuItem[] = [
    {
      key: "edit",
      label: t("wallets.actions.edit"),
      icon: "create-outline",
      onPress: () => onEdit(wallet),
    },
    {
      key: "delete",
      label: t("wallets.actions.delete"),
      icon: "trash-outline",
      destructive: true,
      onPress: () => onDelete(wallet),
    },
  ];

  return (
    <DropdownMenu
      items={items}
      accessibilityLabel={t("wallets.actions.menuLabel")}
      trigger={
        <View className="size-7 flex-col items-center justify-center rounded-full">
          <Ionicons name="ellipsis-vertical" size={16} color="#8a978c" />
        </View>
      }
    />
  );
}
