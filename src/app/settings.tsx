import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

/** Settings screen (opened via the icon in the Home header). Filled in later. */
export default function Settings() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-brand-sheet px-6">
      <Text className="text-lg font-semibold text-brand-logo-fg">Settings</Text>
      <Pressable onPress={() => router.back()} hitSlop={8}>
        <Text className="text-brand-primary">Back</Text>
      </Pressable>
    </View>
  );
}
