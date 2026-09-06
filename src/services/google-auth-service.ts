import Constants from "expo-constants";

import { DRIVE_FILE_SCOPE } from "./drive-service";

/**
 * Google sign-in, scoped to what Drive backup needs and nothing else.
 *
 * Deliberately separate from `auth-service.ts`. That one is the seam for
 * onboarding's "Continue with Google" button, which also has to create or
 * upgrade the local account row; turning it on is its own piece of work. This
 * module only ever authorises API calls — it never touches the users table, so
 * signing in here does not change who the app thinks you are.
 *
 * The library handles token refresh natively: `getTokens()` returns a fresh
 * access token, so there is nothing for us to persist.
 */

/**
 * The **Web** OAuth client id, not the Android one. The native SDK needs the
 * web client to mint tokens; the Android client is matched by package name and
 * signing certificate and is never named in code.
 *
 * It is not a secret — it ships inside the APK either way — so it lives in the
 * app config rather than in an environment file.
 */
const WEB_CLIENT_ID =
  (Constants.expoConfig?.extra?.googleWebClientId as string | undefined) ?? "";

type GoogleSigninModule =
  typeof import("@react-native-google-signin/google-signin").GoogleSignin;

/**
 * Loaded on demand rather than imported, because the package reaches for its
 * native counterpart at module scope: `TurboModuleRegistry.getEnforcing`
 * throws outright when `RNGoogleSignin` is not in the binary. A plain top-level
 * import therefore takes down the root layout — and with it the file backup
 * path, which needs nothing from Google at all.
 *
 * A binary without the module is the normal state after `npx expo install`
 * and before `npx expo run:android`, and it is also what Expo Go always looks
 * like. Treat it as "Drive is off", not as a crash.
 *
 * `undefined` means not yet attempted; `null` means attempted and absent.
 */
let googleSignin: GoogleSigninModule | null | undefined;

function loadGoogleSignin(): GoogleSigninModule | null {
  if (googleSignin !== undefined) return googleSignin;

  try {
    // Typed on the way in — `require` hands back `any`, and assigning `any`
    // straight to `googleSignin` would widen it back to include `undefined`.
    const loaded: GoogleSigninModule =
      require("@react-native-google-signin/google-signin").GoogleSignin;
    googleSignin = loaded;
  } catch (error) {
    console.warn(
      "Google Sign-In is not in this binary — Drive backup is disabled. Rebuild with `npx expo run:android` to enable it.",
      error,
    );
    googleSignin = null;
  }

  return googleSignin;
}

/** Why the Drive card cannot be offered, or `null` when it can. */
export type DriveUnavailableReason = "missingModule" | "notConfigured";

/** Thrown when the user backs out of the Google sheet. Not an error to show. */
export class SignInCancelledError extends Error {
  constructor() {
    super("Google sign-in was cancelled.");
    this.name = "SignInCancelledError";
  }
}

let isConfigured = false;

export const googleAuthService = {
  /**
   * Why Drive is off, or `null` when it is on. The two reasons need different
   * advice — one is a rebuild, the other is a client id — so the screen shows
   * them separately rather than one vague sentence.
   */
  unavailableReason(): DriveUnavailableReason | null {
    if (loadGoogleSignin() === null) return "missingModule";
    if (WEB_CLIENT_ID.length === 0) return "notConfigured";
    return null;
  },

  /**
   * Whether Drive backup can be offered at all. False until the native module
   * is in the binary *and* a client id is set in `app.json`, which lets the app
   * run — and the file export/import path work — before either is true.
   */
  isAvailable(): boolean {
    return googleAuthService.unavailableReason() === null;
  },

  /**
   * Must run before any other call here. Idempotent, and a no-op when Drive is
   * unavailable, so the root layout can call it unconditionally.
   */
  configure(): void {
    if (isConfigured || !googleAuthService.isAvailable()) return;

    loadGoogleSignin()?.configure({
      webClientId: WEB_CLIENT_ID,
      scopes: [DRIVE_FILE_SCOPE],
    });
    isConfigured = true;
  },

  /** The signed-in account's email, or null when nobody is signed in. */
  getSignedInEmail(): string | null {
    const google = loadGoogleSignin();
    if (!google || !googleAuthService.isAvailable()) return null;
    return google.getCurrentUser()?.user.email ?? null;
  },

  /**
   * Restores a previous session without showing any UI. Returns the email, or
   * null when there is nothing saved — which is the normal first-launch case,
   * not a failure.
   */
  async restoreSession(): Promise<string | null> {
    if (!googleAuthService.isAvailable()) return null;
    googleAuthService.configure();

    const response = await requireGoogleSignin().signInSilently();
    return response.type === "success" ? response.data.user.email : null;
  },

  /** Shows the Google account sheet. Throws `SignInCancelledError` if dismissed. */
  async signIn(): Promise<string> {
    googleAuthService.configure();
    const google = requireGoogleSignin();

    await google.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await google.signIn();
    if (response.type !== "success") throw new SignInCancelledError();

    return response.data.user.email;
  },

  /**
   * A Drive-capable access token, signing in first if needed.
   *
   * Consent is incremental: a user who signed in before the Drive scope was
   * asked for keeps their session and is only prompted for the extra
   * permission, rather than being signed out and back in.
   */
  async getDriveAccessToken(): Promise<string> {
    googleAuthService.configure();
    const google = requireGoogleSignin();

    let user = google.getCurrentUser();
    if (!user) {
      const silent = await google.signInSilently();
      user = silent.type === "success" ? silent.data : null;
    }
    if (!user) {
      await googleAuthService.signIn();
      user = google.getCurrentUser();
    }

    if (user && !user.scopes.includes(DRIVE_FILE_SCOPE)) {
      const granted = await google.addScopes({ scopes: [DRIVE_FILE_SCOPE] });
      if (granted?.type !== "success") throw new SignInCancelledError();
    }

    const { accessToken } = await google.getTokens();
    return accessToken;
  },

  async signOut(): Promise<void> {
    const google = loadGoogleSignin();
    if (!google || !googleAuthService.isAvailable()) return;
    await google.signOut();
  },
};

/**
 * For the paths that cannot degrade — nothing sensible happens without a token.
 * The screen never reaches them, since it hides every Drive control behind
 * `isAvailable()`; this is the backstop if that ever slips.
 */
function requireGoogleSignin(): GoogleSigninModule {
  const google = loadGoogleSignin();
  if (!google) {
    throw new Error(
      "Google Sign-In is not in this binary. Rebuild with `npx expo run:android`.",
    );
  }
  return google;
}
