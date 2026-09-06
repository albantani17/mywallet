import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useActiveLocale } from "@/hooks/use-active-locale";
import { useThemeColors } from "@/hooks/use-theme-colors";
import type { DriveFile } from "@/services/drive-service";
import { formatDate } from "@/utils/format-date";

type DriveBackupListProps = {
  backups: DriveFile[];
  isLoading: boolean;
  isDisabled: boolean;
  onSelect: (file: DriveFile) => void;
};

/** "12,4 KB" — a rough size so a truncated upload is visible at a glance. */
function formatSize(bytes: number | null, locale: string): string {
  if (bytes === null) return "—";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`;
}

export function DriveBackupList({
  backups,
  isLoading,
  isDisabled,
  onSelect,
}: DriveBackupListProps) {
  const colors = useThemeColors();
  const { locale } = useActiveLocale();
  const { t } = useTranslation();

  if (isLoading && backups.length === 0) {
    return (
      <View className="flex-col items-center py-8">
        <ActivityIndicator colorClassName="accent-fg" />
      </View>
    );
  }

  if (backups.length === 0) {
    return (
      <View className="flex-col gap-1 py-6">
        <Text className="text-center text-sm font-semibold text-fg">
          {t("backup.drive.empty")}
        </Text>
        <Text className="text-center text-xs text-fg-muted">
          {t("backup.drive.emptyHint")}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-col">
      {backups.map((file) => (
        <Pressable
          key={file.id}
          accessibilityRole="button"
          accessibilityLabel={t("backup.drive.restore")}
          disabled={isDisabled}
          onPress={() => onSelect(file)}
          className="flex-row items-center gap-3 py-3 active:opacity-70"
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={colors.fgMuted}
          />
          <View className="flex-1 flex-col">
            <Text className="text-sm font-semibold text-fg" numberOfLines={1}>
              {file.name}
            </Text>
            <Text className="mt-0.5 text-xs text-fg-muted">
              {formatDate(new Date(file.modifiedTime), locale)} ·{" "}
              {formatSize(file.size, locale)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.fgMuted} />
        </Pressable>
      ))}
    </View>
  );
}
