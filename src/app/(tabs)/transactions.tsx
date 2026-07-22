import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export default function Transactions() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-brand-canvas">
      <Text className="text-lg font-semibold text-white">
        {t("tabs.transactions")}
      </Text>
    </View>
  );
}
