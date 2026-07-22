import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useTotalAssets } from "@/hooks/use-total-assets";
import { formatIDR } from "@/lib/format-currency";

const MASK = "Rp ••••••••";

/** Blok Total Aset: label, nominal (bisa disembunyikan), dan tautan ke dompet. */
export function TotalAssetsCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const { total } = useTotalAssets();
  // Default tersembunyi, menyamai referensi (saldo di-mask sampai ditekan).
  const [hidden, setHidden] = useState(true);

  return (
    <View>
      <Text className="text-sm text-white/70">{t("home.totalAssets")}</Text>

      <View className="mt-1 flex-row items-center gap-3">
        <Text className="text-3xl font-extrabold text-white">
          {hidden ? MASK : formatIDR(total)}
        </Text>
        <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10}>
          <Ionicons
            name={hidden ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="rgba(255,255,255,0.8)"
          />
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push("/wallets")}
        hitSlop={6}
        className="mt-4 flex-row items-center gap-1"
      >
        <Text className="text-sm font-semibold text-white">
          {t("home.allWallets")}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#ffffff" />
      </Pressable>
    </View>
  );
}
