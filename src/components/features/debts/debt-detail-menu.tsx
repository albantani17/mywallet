import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { DropdownMenu, type DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { DebtStatus } from "@/db";
import { useThemeColors } from "@/hooks/use-theme-colors";

type DebtDetailMenuProps = {
  status: DebtStatus;
  /** Deleting is only offered while nothing has been paid against the debt. */
  canDelete: boolean;
  onCancel: () => void;
  onWriteOff: () => void;
  onDelete: () => void;
};

/**
 * The actions that change what a debt *is*, rather than what has been paid on
 * it.
 *
 * Cancel and write off only make sense while the debt is running. Delete is
 * hidden the moment a payment exists — the service refuses it anyway, and
 * offering a button that always fails is worse than not offering it: the user
 * wants "cancel", which keeps the history.
 */
export function DebtDetailMenu({
  status,
  canDelete,
  onCancel,
  onWriteOff,
  onDelete,
}: DebtDetailMenuProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const items: DropdownMenuItem[] = [];

  if (status === "active") {
    items.push({
      key: "cancel",
      label: t("debts.actions.cancel"),
      icon: "close-circle-outline",
      onPress: onCancel,
    });
    items.push({
      key: "writeOff",
      label: t("debts.actions.writeOff"),
      icon: "document-text-outline",
      onPress: onWriteOff,
    });
  }

  if (canDelete) {
    items.push({
      key: "delete",
      label: t("debts.actions.delete"),
      icon: "trash-outline",
      destructive: true,
      onPress: onDelete,
    });
  }

  if (items.length === 0) return null;

  return (
    <DropdownMenu
      items={items}
      accessibilityLabel={t("debts.actions.menuLabel")}
      trigger={
        <View className="size-10 flex-col items-center justify-center rounded-full bg-surface">
          <Ionicons name="ellipsis-vertical" size={18} color={colors.fg} />
        </View>
      }
    />
  );
}
