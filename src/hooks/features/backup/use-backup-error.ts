import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { BackupError } from "@/services/backup-service";
import { DriveAuthError } from "@/services/drive-service";
import { SignInCancelledError } from "@/services/google-auth-service";

/**
 * Turns whatever a backup path threw into a sentence, or into `null` when
 * there is nothing to say.
 *
 * Cancelling the Google sheet is the `null` case: the user meant to back out,
 * and answering that with a red error would be nonsense.
 */
export function useBackupError() {
  const { t } = useTranslation();

  return useCallback(
    (error: unknown, fallbackKey: "backup" | "restore" | "list" | "signIn") => {
      if (error instanceof SignInCancelledError) return null;

      if (error instanceof DriveAuthError) {
        return t("backup.errors.unauthorized");
      }

      if (error instanceof BackupError) {
        // The four codes map one-to-one onto keys under backup.errors.
        switch (error.code) {
          case "unknownFormat":
            return t("backup.errors.unknownFormat");
          case "futureFormat":
            return t("backup.errors.futureFormat");
          case "futureSchema":
            return t("backup.errors.futureSchema");
          case "corrupt":
            return t("backup.errors.corrupt");
        }
      }

      switch (fallbackKey) {
        case "backup":
          return t("backup.errors.backup");
        case "restore":
          return t("backup.errors.restore");
        case "list":
          return t("backup.errors.list");
        case "signIn":
          return t("backup.errors.signIn");
      }
    },
    [t],
  );
}
