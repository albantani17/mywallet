/**
 * Google sign-in is not wired up yet — the onboarding button is rendered but
 * disabled. Landing it needs three things that are out of scope for now:
 *
 *   1. Android + Web OAuth client IDs from Google Cloud.
 *   2. A development build; the OAuth flow does not run in Expo Go.
 *   3. `expo-auth-session` + `expo-crypto` installed via `npx expo install`.
 *
 * The database side is already in place: `users.authProvider` accepts
 * "google", `users.email` is nullable, and `userRepository.linkEmail(email)`
 * upgrades the existing guest row in place — so signing in with Google later
 * keeps whatever wallets and transactions the guest already recorded.
 *
 * Note that Google sign-in itself *is* wired up, in
 * `src/services/google-auth-service.ts` — but only to authorise Drive backup.
 * It never touches the users table. Landing this seam means calling
 * `googleAuthService.signIn()` and then `userRepository.linkEmail(email)`.
 */
export const authService = {
  isGoogleSignInAvailable(): boolean {
    return false;
  },

  async signInWithGoogle(): Promise<never> {
    throw new Error(
      "Google sign-in is not implemented yet. See src/services/auth-service.ts.",
    );
  },
};
