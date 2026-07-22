import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect } from "react";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { userService } from "@/services/user-service";

/**
 * Sumber kebenaran user aktif untuk UI. Membungkus useLiveQuery + sinkronisasi
 * locale, sehingga komponen cukup membaca { user, isReady, error } tanpa
 * menyentuh layer DB/service secara langsung.
 */
export function useCurrentUser() {
  const { data, error, updatedAt } = useLiveQuery(
    db.select().from(usersTable).limit(1),
  );

  const user = data?.[0];

  // Selaraskan bahasa aplikasi dengan preferensi user yang tersimpan.
  useEffect(() => {
    userService.applyUserLocale(user);
  }, [user]);

  return {
    user,
    // `updatedAt` masih undefined sampai query pertama selesai — dipakai UI
    // untuk mencegah kedip onboarding bagi user yang sudah ada.
    isReady: updatedAt !== undefined,
    error,
  };
}
