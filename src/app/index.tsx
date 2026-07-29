import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import Onboarding from "@/components/features/onboarding";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function Index() {
  const { user, isReady, error } = useCurrentUser();

  if (error) {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-base p-6">
        <Text className="text-center text-danger">{error.message}</Text>
      </View>
    );
  }

  // Hold the render until the first query resolves, so an existing user never
  // sees onboarding flash by.
  if (!isReady) {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-base">
        <ActivityIndicator colorClassName="accent-fg" />
      </View>
    );
  }

  if (!user) {
    return <Onboarding />;
  }

  // The tabs layout gates again on wallets and redirects to create-wallet when
  // there are none.
  return <Redirect href="/home" />;
}
