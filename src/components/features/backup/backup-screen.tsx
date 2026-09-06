import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Screen } from "@/components/ui/screen";
import { useBackup } from "@/hooks/features/backup/use-backup";
import { useRestore } from "@/hooks/features/backup/use-restore";
import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { formatDate } from "@/utils/format-date";

import { DriveBackupList } from "./drive-backup-list";
import { RestoreConfirmSheet } from "./restore-confirm-sheet";

export function BackupScreen() {
  const colors = useThemeColors();
  const { locale } = useActiveLocale();
  const { t } = useTranslation();

  const backup = useBackup();

  // Every live query has already re-read by the time this fires — the restore
  // wrote through the open connection, so the change bus did the work. All
  // that is left is to put the user somewhere the restored data is on screen.
  const onRestored = useCallback(() => {
    router.replace("/home");
  }, []);
  const restore = useRestore(onRestored);

  const isBusy = backup.isBusy || restore.isBusy;
  const error = restore.error ?? backup.error;
  const notice = restore.notice ?? backup.notice;

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/home");
  }, []);

  return (
    <Screen scrollable>
      <View className="flex-col gap-3 px-6">
        <View className="flex-row items-center gap-3 pb-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("backup.confirm.cancel")}
            onPress={close}
            className="size-10 flex-col items-center justify-center rounded-full bg-surface active:opacity-70"
          >
            <Ionicons name="chevron-back" size={20} color={colors.fg} />
          </Pressable>
          <Text className="flex-1 text-2xl font-extrabold text-fg">
            {t("backup.title")}
          </Text>
        </View>

        <Text className="pb-1 text-sm leading-5 text-fg-muted">
          {t("backup.subtitle")}
        </Text>

        {error ? (
          <Text className="text-sm text-danger">{error}</Text>
        ) : notice ? (
          <Text className="text-sm text-fg-muted">{notice}</Text>
        ) : null}

        <Card>
          <Text className="text-xs font-medium text-fg-muted">
            {t("backup.drive.section")}
          </Text>

          {!backup.isDriveAvailable ? (
            <Text className="mt-2 text-sm leading-5 text-fg-muted">
              {backup.unavailableReason === "missingModule"
                ? t("backup.drive.missingModule")
                : t("backup.drive.unavailable")}
            </Text>
          ) : backup.email === null ? (
            <>
              <Text className="mt-2 text-sm leading-5 text-fg-muted">
                {t("backup.drive.description")}
              </Text>
              <Button
                label={t("backup.drive.signIn")}
                onPress={backup.signIn}
                isLoading={backup.isBusy}
                isDisabled={isBusy}
                className="mt-4"
              />
            </>
          ) : (
            <>
              <Text className="mt-1 text-base font-semibold text-fg">
                {t("backup.drive.signedInAs", { email: backup.email })}
              </Text>
              {backup.lastBackupAt ? (
                <Text className="mt-0.5 text-xs text-fg-muted">
                  {t("backup.drive.lastBackup", {
                    time: formatDate(backup.lastBackupAt, locale),
                  })}
                </Text>
              ) : null}

              <View className="mt-4 flex-row gap-3">
                <Button
                  label={t("backup.drive.backUpNow")}
                  onPress={backup.backupToDrive}
                  isLoading={backup.isBusy}
                  isDisabled={isBusy}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  label={t("backup.drive.signOut")}
                  onPress={backup.signOut}
                  isDisabled={isBusy}
                />
              </View>

              <View className="mt-5 flex-row items-center justify-between">
                <Text className="text-xs font-medium text-fg-muted">
                  {t("backup.drive.backupsTitle")}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={isBusy}
                  onPress={backup.refreshBackups}
                  className="active:opacity-70"
                >
                  <Text className="text-xs font-semibold text-primary">
                    {t("backup.drive.refresh")}
                  </Text>
                </Pressable>
              </View>

              <DriveBackupList
                backups={backup.driveBackups}
                isLoading={backup.isLoadingBackups}
                isDisabled={isBusy}
                onSelect={(file) => restore.pickFromDrive(file.id, file.name)}
              />
            </>
          )}
        </Card>

        <Card>
          <Text className="text-xs font-medium text-fg-muted">
            {t("backup.file.section")}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-fg-muted">
            {t("backup.file.description")}
          </Text>

          <View className="mt-4 flex-col gap-3">
            <Button
              variant="secondary"
              label={t("backup.file.export")}
              onPress={backup.exportToFile}
              isDisabled={isBusy}
            />
            <Button
              variant="secondary"
              label={t("backup.file.import")}
              onPress={restore.pickFromFile}
              isDisabled={isBusy}
            />
          </View>
        </Card>
      </View>

      <RestoreConfirmSheet
        pending={restore.pending}
        error={restore.error}
        isSubmitting={restore.isBusy}
        onConfirm={restore.confirm}
        onClose={restore.cancel}
      />
    </Screen>
  );
}
