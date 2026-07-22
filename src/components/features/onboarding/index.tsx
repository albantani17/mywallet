import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomPanel } from "@/components/ui/bottom-panel";
import { LanguageToggle } from "@/components/ui/language-toggle";

import { GuestNameDialog } from "./guest-name-dialog";

export default function Onboarding() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isNameOpen, setIsNameOpen] = useState(false);

  return (
    <View className="flex-1 bg-brand-canvas">
      {/* Lingkaran dekoratif samar (menyamai mockup) */}
      <View className="absolute -right-16 -top-10 size-64 rounded-full bg-brand-canvas-tint opacity-60" />
      <View className="absolute -bottom-24 -left-24 size-72 rounded-full bg-brand-canvas-tint opacity-40" />

      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row justify-end py-2">
          <LanguageToggle />
        </View>

        <View className="flex-1 justify-center pb-56">
          {/* Badge logo */}
          <View className="mb-7 size-14 items-center justify-center rounded-2xl bg-brand-logo">
            <Text className="text-2xl font-extrabold text-brand-logo-fg">S</Text>
          </View>

          <Text className="text-[34px] font-extrabold leading-[40px] text-white">
            {t("onboarding.title")}
          </Text>
          <Text className="mt-4 text-base leading-6 text-brand-muted">
            {t("onboarding.subtitle")}
          </Text>
        </View>
      </View>

      <BottomPanel>
        <Button
          variant="secondary"
          isDisabled
          className="border border-black/10 bg-white"
        >
          <Ionicons name="logo-google" size={18} color="#1f3d2b" />
          <Button.Label className="text-brand-logo-fg">
            {t("onboarding.continueGoogle")}
          </Button.Label>
        </Button>

        <Button className="bg-brand-primary" onPress={() => setIsNameOpen(true)}>
          <Button.Label className="text-white">
            {t("onboarding.guest")}
          </Button.Label>
        </Button>

        <Text className="pt-1 text-center text-xs text-brand-sheet-muted">
          {t("onboarding.guestNote")}
        </Text>
      </BottomPanel>

      <GuestNameDialog isOpen={isNameOpen} onOpenChange={setIsNameOpen} />
    </View>
  );
}
