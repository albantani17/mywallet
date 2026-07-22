import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { userService } from "@/services/user-service";

export type GuestNameForm = { name: string };

/**
 * Logic form pembuatan akun tamu: validasi nama + orkestrasi service.
 * Komponen dialog cukup merender field & tombol dari nilai yang dikembalikan,
 * tanpa tahu soal react-hook-form maupun service di baliknya.
 */
export function useGuestOnboarding(onSuccess: () => void) {
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
  } = useForm<GuestNameForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  const submit = handleSubmit(async ({ name }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await userService.createGuestAccount(name);
      reset();
      onSuccess();
      // Baris user baru terdeteksi oleh useCurrentUser di layar utama →
      // layar otomatis berpindah ke home (isSubmitting sengaja dibiarkan
      // true karena dialog akan segera unmount).
    } catch (e) {
      console.error("Gagal membuat user tamu", e);
      setIsSubmitting(false);
    }
  });

  return { control, errors, isSubmitting, submit };
}
