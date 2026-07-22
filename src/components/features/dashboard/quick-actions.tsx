import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type QuickAction = {
  key: "add" | "transfer" | "debts" | "wallets";
  icon: IoniconName;
  href: Href;
};

const ACTIONS: QuickAction[] = [
  { key: "add", icon: "add", href: "/add-transaction" },
  {
    key: "transfer",
    icon: "swap-horizontal",
    href: { pathname: "/add-transaction", params: { type: "transfer" } },
  },
  { key: "debts", icon: "document-text-outline", href: "/debts" },
  { key: "wallets", icon: "wallet-outline", href: "/wallets" },
];

/** Grid aksi cepat (4 tombol) di bawah Total Aset. */
export function QuickActions() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="mt-6 flex-row justify-between">
      {ACTIONS.map((action) => (
        <Pressable
          key={action.key}
          onPress={() => router.push(action.href)}
          className="flex-col items-center gap-2"
        >
          <View className="size-12 items-center justify-center rounded-2xl bg-white/10">
            <Ionicons name={action.icon} size={22} color="#ffffff" />
          </View>
          <Text className="text-[11px] font-medium text-white">
            {t(`home.actions.${action.key}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
