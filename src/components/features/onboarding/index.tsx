import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BottomSheet,
  Button,
  Dialog,
  FieldError,
  Input,
  Label,
  TextField,
} from "heroui-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { userQueries } from "@/db/queries/user";
import { currentLocale, setLocale, type AppLocale } from "@/i18n";

const LOCALES: AppLocale[] = ["id", "en"];

function LanguageToggle() {
  const { i18n } = useTranslation();
  const active = currentLocale();

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-white/10 p-1">
      {LOCALES.map((locale) => {
        const isActive = active === locale;
        return (
          <Pressable
            key={locale}
            onPress={() => setLocale(locale)}
            hitSlop={6}
            className={`rounded-full px-3 py-1 ${isActive ? "bg-white/90" : ""}`}
          >
            <Text
              className={`text-xs font-semibold ${
                isActive ? "text-brand-logo-fg" : "text-white/70"
              }`}
            >
              {locale.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
      {/* i18n.language dipakai agar toggle ikut re-render saat bahasa berubah */}
      <View className="hidden">{i18n.language}</View>
    </View>
  );
}

type NameForm = { name: string };

function GuestNameDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(1, t("onboarding.nameModal.required")),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NameForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await userQueries.createGuestUser({ name, locale: currentLocale() });
      reset();
      onOpenChange(false);
      // Baris user baru terdeteksi oleh useLiveQuery di src/app/index.tsx →
      // layar otomatis berpindah ke home.
    } catch (e) {
      console.error("Gagal membuat user tamu", e);
      setIsSubmitting(false);
    }
  });

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
                    onSubmitEditing={onSubmit}
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
                onPress={onSubmit}
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

      {/* Bottom sheet FIXED: selalu terbuka, tak bisa ditutup */}
      <BottomSheet isOpen>
        <BottomSheet.Portal>
          <BottomSheet.Content
            enablePanDownToClose={false}
            backgroundClassName="bg-brand-sheet rounded-t-[28px]"
            handleIndicatorClassName="bg-black/15"
          >
            <View
              className="gap-3 px-5 pt-2"
              style={{ paddingBottom: insets.bottom + 8 }}
            >
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

              <Button
                className="bg-brand-primary"
                onPress={() => setIsNameOpen(true)}
              >
                <Button.Label className="text-white">
                  {t("onboarding.guest")}
                </Button.Label>
              </Button>

              <Text className="pt-1 text-center text-xs text-brand-sheet-muted">
                {t("onboarding.guestNote")}
              </Text>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <GuestNameDialog isOpen={isNameOpen} onOpenChange={setIsNameOpen} />
    </View>
  );
}
