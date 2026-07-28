import { useCallback } from "react";
import { useUniwind } from "uniwind";

import type { Theme } from "@/db";
import { useCurrentUser } from "@/hooks/use-current-user";
import { userService } from "@/services/user-service";

/**
 * The active theme plus the stored preference behind it.
 *
 * Simpler than use-active-locale: `useUniwind()` is already tracked React state
 * (it subscribes to Uniwind's own listener), so no manual subscribe is needed
 * to survive the React Compiler.
 *
 * The two values differ on purpose. `theme` is always concrete — what is on
 * screen right now — while `preference` is what the user chose and includes
 * "system". Uniwind stores "system" as `hasAdaptiveThemes` rather than as a
 * theme name, so the user row is what remembers the distinction.
 */
export function useActiveTheme() {
  const { theme, hasAdaptiveThemes } = useUniwind();
  const { user } = useCurrentUser();

  // Fall back to the live state until the user row has loaded, so the toggle
  // never shows nothing selected on the first frame.
  const preference: Theme =
    user?.theme ?? (hasAdaptiveThemes ? "system" : theme);

  const setPreference = useCallback(async (next: Theme) => {
    await userService.changeTheme(next);
  }, []);

  return { theme, preference, setPreference };
}
