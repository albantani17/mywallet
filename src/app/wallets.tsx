import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

/** Wallets screen (opened from the dashboard). Wallet list filled in later. */
export default function Wallets() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-brand-sheet px-6">
      <Text className="text-lg font-semibold text-brand-logo-fg">Wallets</Text>
      <Pressable onPress={() => router.back()} hitSlop={8}>
        <Text className="text-brand-primary">Back</Text>
      </Pressable>
    </View>
  );
}
