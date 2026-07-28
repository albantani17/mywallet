import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect } from "react";

import { db, schema } from "@/db";
import { userService } from "@/services/user-service";

/**
 * Source of truth for the active account. Wraps useLiveQuery plus locale
 * syncing so components only read { user, isReady, error }.
 */
export function useCurrentUser() {
  const { data, error, updatedAt } = useLiveQuery(
    db.select().from(schema.users).limit(1),
  );

  const user = data?.[0];

  useEffect(() => {
    userService.applyUserLocale(user);
  }, [user]);

  return {
    user,
    // `updatedAt` stays undefined until the first query resolves — the screen
    // uses it to avoid flashing onboarding at an existing user.
    isReady: updatedAt !== undefined,
    error,
  };
}
