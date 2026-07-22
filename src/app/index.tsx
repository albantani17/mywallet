import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import Onboarding from "@/components/features/onboarding";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function Index() {
  const { user, isReady, error } = useCurrentUser();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-red-500">{error.message}</Text>
      </View>
    );
  }

  // Tahan render sampai query pertama selesai — cegah kedip onboarding untuk
  // user yang sudah ada.
  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-canvas">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  if (!user) {
    return <Onboarding />;
  }

  // User sudah ada → masuk ke tab navigator.
  return <Redirect href="/(tabs)/home" />;
}
