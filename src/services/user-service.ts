import { Uniwind } from "uniwind";

import { userRepository } from "@/db";
import type { Theme, User } from "@/db";
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
      // Whatever was showing during onboarding — "system" unless the user
      // already flipped the toggle there.
      theme: Uniwind.hasAdaptiveThemes ? "system" : Uniwind.currentTheme,
    });
  },

  /**
   * Aligns the running app with the preferences stored on the user row. Called
   * on every user change, so it is also what restores them on a cold start.
   */
  applyUserPreferences(
    user: Pick<User, "locale" | "theme"> | null | undefined,
  ) {
    if (!user) return;

    setLocale(user.locale as AppLocale);
    Uniwind.setTheme(user.theme as Theme);
  },

  /** Persists a language change made after onboarding. */
  async changeLocale(locale: AppLocale) {
    await setLocale(locale);
    return userRepository.update({ locale });
  },

  /**
   * Persists a theme change. `Uniwind.setTheme` also calls
   * Appearance.setColorScheme, so RN's own components and the status bar
   * follow without any extra wiring.
   */
  async changeTheme(theme: Theme) {
    Uniwind.setTheme(theme);
    return userRepository.update({ theme });
  },
};
