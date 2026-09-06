import * as DocumentPicker from "expo-document-picker";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  backupService,
  totalRows,
  type BackupFile,
} from "@/services/backup-service";
import { driveService } from "@/services/drive-service";
import { googleAuthService } from "@/services/google-auth-service";

import { useBackupError } from "./use-backup-error";

/** A validated backup, waiting on the confirmation step. */
export type PendingRestore = {
  file: BackupFile;
  /** Where it came from, for the confirm sheet's heading. */
  label: string;
  createdAt: Date;
  rows: number;
};

/**
 * Choosing a backup, previewing it and — only after an explicit confirmation —
 * replacing everything on the device with it.
 *
 * The two picking paths validate before they return, so a file this app cannot
 * read is rejected while the database is still untouched. Nothing here writes
 * until `confirm` runs.
 */
export function useRestore(onRestored: () => void) {
  const { t } = useTranslation();
  const messageFor = useBackupError();

  const [pending, setPending] = useState<PendingRestore | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inspect = useCallback((text: string, label: string) => {
    const file = backupService.inspectBackup(text);
    setPending({
      file,
      label,
      createdAt: new Date(file.createdAt),
      rows: totalRows(file),
    });
  }, []);

  const pickFromDrive = useCallback(
    async (fileId: string, name: string) => {
      if (isBusy) return;

      setIsBusy(true);
      setError(null);
      setNotice(null);
      try {
        const token = await googleAuthService.getDriveAccessToken();
        inspect(await driveService.downloadBackup(token, fileId), name);
      } catch (e) {
        console.error("Failed to read the Drive backup", e);
        setError(messageFor(e, "restore"));
      } finally {
        setIsBusy(false);
      }
    },
    [inspect, isBusy, messageFor],
  );

  const pickFromFile = useCallback(async () => {
    if (isBusy) return;

    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        // Some file providers hand JSON back as octet-stream, so the filter
        // stays wide and `inspectBackup` is what actually rejects the file.
        type: ["application/json", "*/*"],
        copyToCacheDirectory: true,
      });
      if (picked.canceled) return;

      const asset = picked.assets[0];
      inspect(await backupService.readFile(asset.uri), asset.name);
    } catch (e) {
      console.error("Failed to read the backup file", e);
      setError(messageFor(e, "restore"));
    } finally {
      setIsBusy(false);
    }
  }, [inspect, isBusy, messageFor]);

  const cancel = useCallback(() => {
    if (isBusy) return;
    setPending(null);
    setError(null);
  }, [isBusy]);

  const confirm = useCallback(async () => {
    if (isBusy || !pending) return;

    setIsBusy(true);
    setError(null);
    try {
      await backupService.restoreBackup(pending.file);
      setPending(null);
      setNotice(t("backup.done.restored"));
      // Every write went through the open connection, so the change bus has
      // already told each live query to re-read. The caller only has to move
      // the user somewhere the restored data is visible.
      onRestored();
    } catch (e) {
      console.error("Failed to restore the backup", e);
      setError(messageFor(e, "restore"));
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, messageFor, onRestored, pending, t]);

  return {
    pending,
    isBusy,
    error,
    notice,
    pickFromDrive,
    pickFromFile,
    confirm,
    cancel,
  };
}
