import LottieView from "lottie-react-native";
import { View } from "react-native";

/**
 * The welcome animation on the onboarding screen.
 *
 * assets/animations/welcome.json is a placeholder — drop your own Lottie file
 * in at that path to replace it. Everything Lottie-specific lives here, so
 * swapping the library or the asset only touches this file.
 */
export function WelcomeAnimation() {
  return (
    <View className="h-52 w-full flex-col items-center justify-center">
      <LottieView
        // Relative on purpose: Metro resolves the "@/*" alias to src/, but not
        // the "@/assets/*" one, so an aliased require fails at bundle time.
        source={require("../../../../assets/animations/welcome.json")}
        autoPlay
        loop
        style={{ width: 208, height: 208 }}
      />
    </View>
  );
}
