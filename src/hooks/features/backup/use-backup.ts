import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { backupService } from "@/services/backup-service";
import { driveService, type DriveFile } from "@/services/drive-service";
import { googleAuthService } from "@/services/google-auth-service";

import { useBackupError } from "./use-backup-error";

/**
 * Creating a backup and sending it somewhere — Drive, or a file the user
 * places themselves. Restoring is `use-restore.ts`; the two are separate
 * because only one of them can destroy anything.
 */
export function useBackup() {
  const { t } = useTranslation();
  const messageFor = useBackupError();

  // Read once per render rather than stored: the answer cannot change without
  // a new binary or a new app config, both of which restart the JS runtime.
  const unavailableReason = googleAuthService.unavailableReason();
  const isDriveAvailable = unavailableReason === null;

  const [email, setEmail] = useState<string | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveFile[]>([]);
  const [lastBackupAt, setLastBackupAt] = useState<Date | null>(null);

  const [isBusy, setIsBusy] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadBackups = useCallback(async () => {
    setIsLoadingBackups(true);
    try {
      const token = await googleAuthService.getDriveAccessToken();
      const folderId = await driveService.ensureBackupFolder(token);
      setDriveBackups(await driveService.listBackups(token, folderId));
      setError(null);
    } catch (e) {
      console.error("Failed to list Drive backups", e);
      setError(messageFor(e, "list"));
    } finally {
      setIsLoadingBackups(false);
    }
  }, [messageFor]);

  // Guards the effect below against re-running. `loadBackups` is rebuilt
  // whenever `t` changes identity, which happens on every language switch —
  // without this, flipping the language would silently re-authenticate and
  // re-list.
  const hasTriedRestore = useRef(false);

  // Restores a previous Google session without any UI, so a returning user
  // does not have to sign in again to see their backups. Nothing saved is the
  // ordinary first-visit case, not a failure worth reporting.
  useEffect(() => {
    if (!isDriveAvailable || hasTriedRestore.current) return;
    hasTriedRestore.current = true;

    let isCurrent = true;
    googleAuthService
      .restoreSession()
      .then((restored) => {
        if (!isCurrent || !restored) return;
        setEmail(restored);
        void loadBackups();
      })
      .catch((e) => console.error("Failed to restore the Google session", e));

    return () => {
      isCurrent = false;
    };
  }, [isDriveAvailable, loadBackups]);

  const signIn = useCallback(async () => {
    if (isBusy) return;

    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      setEmail(await googleAuthService.signIn());
      await loadBackups();
    } catch (e) {
      console.error("Failed to sign in to Google", e);
      setError(messageFor(e, "signIn"));
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, loadBackups, messageFor]);

  const signOut = useCallback(async () => {
    if (isBusy) return;

    setIsBusy(true);
    try {
      await googleAuthService.signOut();
      setEmail(null);
      setDriveBackups([]);
      setError(null);
      setNotice(null);
    } catch (e) {
      console.error("Failed to sign out of Google", e);
      setError(messageFor(e, "signIn"));
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, messageFor]);

  const backupToDrive = useCallback(async () => {
    if (isBusy) return;

    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      const prepared = backupService.createBackup();
      const token = await googleAuthService.getDriveAccessToken();
      const folderId = await driveService.ensureBackupFolder(token);
      const uploaded = await driveService.uploadBackup(
        token,
        folderId,
        prepared.fileName,
        prepared.content,
      );

      // Prepended rather than re-listed: Drive's own index lags a moment
      // behind an upload, so asking for the folder again can come back
      // without the file that was just written.
      setDriveBackups((current) => [uploaded, ...current]);
      setLastBackupAt(prepared.createdAt);
      setEmail(googleAuthService.getSignedInEmail());
      setNotice(t("backup.done.uploaded"));
    } catch (e) {
      console.error("Failed to back up to Drive", e);
      setError(messageFor(e, "backup"));
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, messageFor, t]);

  const exportToFile = useCallback(async () => {
    if (isBusy) return;

    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      const prepared = backupService.createBackup();
      const uri = backupService.writeToCache(prepared);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: prepared.fileName,
          UTI: "public.json",
        });
      }

      setLastBackupAt(prepared.createdAt);
      // Without a share sheet the file still exists — say where, rather than
      // claiming it is ready to share when no chooser ever appeared.
      setNotice(
        canShare
          ? t("backup.done.exported")
          : t("backup.done.snapshot", { uri }),
      );
    } catch (e) {
      console.error("Failed to export the backup to a file", e);
      setError(messageFor(e, "backup"));
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, messageFor, t]);

  return {
    isDriveAvailable,
    unavailableReason,
    email,
    driveBackups,
    lastBackupAt,
    isBusy,
    isLoadingBackups,
    error,
    notice,
    signIn,
    signOut,
    refreshBackups: loadBackups,
    backupToDrive,
    exportToFile,
  };
}
