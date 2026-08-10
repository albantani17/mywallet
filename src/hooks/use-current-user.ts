import { useEffect } from "react";

import { db, schema } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";
import { userService } from "@/services/user-service";

/**
 * Source of truth for the active account. Wraps the live query plus preference
 * syncing so components only read { user, isReady, error }.
 */
export function useCurrentUser() {
  const { data, error, updatedAt } = useLiveData(
    db.select().from(schema.users).limit(1),
    [schema.users],
  );

  const user = data?.[0];

  useEffect(() => {
    userService.applyUserPreferences(user);
  }, [user]);

  return {
    user,
    // `updatedAt` stays undefined until the first query resolves — the screen
    // uses it to avoid flashing onboarding at an existing user.
    isReady: updatedAt !== undefined,
    error,
  };
}
