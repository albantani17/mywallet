import {
  Button,
  Dialog,
  FieldError,
  Input,
  Label,
  TextField,
} from "heroui-native";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, View } from "react-native";

import { useGuestOnboarding } from "@/hooks/use-guest-onboarding";

type GuestNameDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Dialog input nama untuk membuat akun tamu saat onboarding. */
export function GuestNameDialog({ isOpen, onOpenChange }: GuestNameDialogProps) {
  const { t } = useTranslation();
  const { control, errors, isSubmitting, submit } = useGuestOnboarding(() =>
    onOpenChange(false),
  );

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Dialog.Content>
            <View className="mb-5 gap-1.5">
              <Dialog.Title>{t("onboarding.nameModal.title")}</Dialog.Title>
              <Dialog.Description>
                {t("onboarding.nameModal.description")}
              </Dialog.Description>
            </View>

            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextField isInvalid={!!errors.name} isRequired>
                  <Label>{t("onboarding.nameModal.title")}</Label>
                  <Input
                    autoFocus
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t("onboarding.nameModal.placeholder")}
                    returnKeyType="done"
                    onSubmitEditing={submit}
                  />
                  {errors.name ? (
                    <FieldError>{errors.name.message}</FieldError>
                  ) : null}
                </TextField>
              )}
            />

            <View className="mt-5 flex-row justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                isDisabled={isSubmitting}
                onPress={() => onOpenChange(false)}
              >
                {t("onboarding.nameModal.cancel")}
              </Button>
              <Button
                size="sm"
                className="bg-brand-primary"
                isDisabled={isSubmitting}
                onPress={submit}
              >
                <Button.Label className="text-white">
                  {t("onboarding.nameModal.submit")}
                </Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </KeyboardAvoidingView>
      </Dialog.Portal>
    </Dialog>
  );
}
