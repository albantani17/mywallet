import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { authService } from "@/services/auth-service";

import { GuestNameDialog } from "./guest-name-dialog";
import { WelcomeAnimation } from "./welcome-animation";

export default function Onboarding() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isNameOpen, setIsNameOpen] = useState(false);

  const isGoogleAvailable = authService.isGoogleSignInAvailable();

  return (
    <View className="flex-1 flex-col bg-canvas">
      {/* Soft decorative circles behind the content. */}
      <View className="absolute -right-16 -top-10 size-64 rounded-full bg-surface opacity-60" />
      <View className="absolute -bottom-24 -left-24 size-72 rounded-full bg-surface opacity-40" />

      <View
        className="flex-1 flex-col px-6"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row justify-end py-2">
          <LanguageToggle />
        </View>

        <View className="flex-1 flex-col justify-center pb-64">
          <WelcomeAnimation />

          <Text className="mt-6 text-[32px] font-extrabold leading-[38px] text-fg">
            {t("onboarding.title")}
          </Text>
          <Text className="mt-4 text-base leading-6 text-fg-muted">
            {t("onboarding.subtitle")}
          </Text>
        </View>
      </View>

      {/* Static panel rather than a bottom sheet: an always-open sheet renders
          blank on Android under reanimated 4. */}
      <View
        className="absolute inset-x-0 bottom-0 flex-col gap-3 rounded-t-[28px] bg-surface px-6 pt-6"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="mb-2 h-1 w-10 self-center rounded-full bg-line" />

        <Button
          variant="secondary"
          label={t("onboarding.continueGoogle")}
          isDisabled={!isGoogleAvailable}
          onPress={authService.signInWithGoogle}
        />
        {!isGoogleAvailable ? (
          <Text className="-mt-1 text-center text-xs text-fg-muted">
            {t("onboarding.comingSoon")}
          </Text>
        ) : null}

        <Button
          label={t("onboarding.guest")}
          onPress={() => setIsNameOpen(true)}
        />

        <Text className="pt-1 text-center text-xs text-fg-muted">
          {t("onboarding.guestNote")}
        </Text>
      </View>

      <GuestNameDialog
        isOpen={isNameOpen}
        onClose={() => setIsNameOpen(false)}
      />
    </View>
  );
}
