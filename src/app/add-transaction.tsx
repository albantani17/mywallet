import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

/** Add-transaction screen (opened via the FAB). Modal — filled in a later step. */
export default function AddTransaction() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-brand-sheet px-6">
      <Text className="text-lg font-semibold text-brand-logo-fg">
        Add Transaction
      </Text>
      <Pressable onPress={() => router.back()} hitSlop={8}>
        <Text className="text-brand-primary">Close</Text>
      </Pressable>
    </View>
  );
}
