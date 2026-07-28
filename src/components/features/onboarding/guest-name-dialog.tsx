import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useGuestOnboarding } from "@/hooks/features/onboarding/use-guest-onboarding";

type GuestNameDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

/** Asks for a name, then creates the guest account. */
export function GuestNameDialog({ isOpen, onClose }: GuestNameDialogProps) {
  const { t } = useTranslation();
  const { name, error, isSubmitting, changeName, submit, reset } =
    useGuestOnboarding(onClose);

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      // Android hardware back button.
      onRequestClose={close}
      statusBarTranslucent
    >
      <View className="flex-1 flex-col justify-center bg-scrim px-6">
        {/* Tapping the backdrop dismisses; the card below swallows the press. */}
        <Pressable className="absolute inset-0" onPress={close} />

        <KeyboardAvoidingView
          // Android relies on the default adjustResize behaviour.
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-col rounded-3xl bg-surface p-6">
            <Text className="text-xl font-bold text-fg">
              {t("onboarding.nameModal.title")}
            </Text>
            <Text className="mt-1.5 text-sm leading-5 text-fg-muted">
              {t("onboarding.nameModal.description")}
            </Text>

            <View className="mt-5">
              <TextField
                autoFocus
                value={name}
                onChangeText={changeName}
                error={error}
                placeholder={t("onboarding.nameModal.placeholder")}
                returnKeyType="done"
                maxLength={50}
                onSubmitEditing={submit}
              />
            </View>

            <View className="mt-5 flex-row justify-end gap-3">
              <Button
                variant="ghost"
                label={t("onboarding.nameModal.cancel")}
                isDisabled={isSubmitting}
                onPress={close}
              />
              <Button
                label={t("onboarding.nameModal.submit")}
                isLoading={isSubmitting}
                onPress={submit}
                className="px-7"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
