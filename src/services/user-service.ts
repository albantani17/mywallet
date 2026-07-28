import { userRepository } from "@/db";
import type { User } from "@/db";
import { currentLocale, setLocale, type AppLocale } from "@/i18n";

/**
 * Business logic around the local account. Orchestrates the repository layer
 * and i18n so components never reach into the database directly.
 */
export const userService = {
  /**
   * Creates the guest account during onboarding, stamping it with whichever
   * language the user picked on the onboarding screen. The new row is what
   * marks onboarding as complete (see useCurrentUser).
   */
  async createGuestAccount(name: string) {
    return userRepository.createGuest({
      name: name.trim(),
      locale: currentLocale(),
    });
  },

  /** Aligns the app language with the preference stored on the user row. */
  applyUserLocale(user: Pick<User, "locale"> | null | undefined) {
    if (user?.locale) {
      setLocale(user.locale as AppLocale);
    }
  },

  /** Persists a language change made after onboarding. */
  async changeLocale(locale: AppLocale) {
    await setLocale(locale);
    return userRepository.update({ locale });
  },
};
