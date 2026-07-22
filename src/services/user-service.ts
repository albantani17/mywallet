import { userQueries } from "@/db/queries/user";
import type { User } from "@/db/validator/user";
import { currentLocale, setLocale, type AppLocale } from "@/i18n";

/**
 * Business logic seputar user. Mengorkestrasi query DB (`@/db/queries`) +
 * i18n, sehingga komponen UI tidak menyentuh layer data secara langsung.
 */
export const userService = {
  /**
   * Buat akun tamu saat onboarding. Bahasa diambil dari locale aktif aplikasi.
   * Baris user baru menandai onboarding selesai (dipantau useLiveQuery).
   */
  async createGuestAccount(name: string) {
    return userQueries.createGuestUser({
      name: name.trim(),
      locale: currentLocale(),
    });
  },

  /** Selaraskan bahasa aplikasi dengan preferensi user yang tersimpan. */
  applyUserLocale(user: Pick<User, "locale"> | null | undefined) {
    if (user?.locale) {
      setLocale(user.locale as AppLocale);
    }
  },
};
