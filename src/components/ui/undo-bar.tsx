import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

type UndoBarProps = {
  message: string;
  actionLabel: string;
  /**
   * Changes whenever a new action becomes undoable. The countdown restarts on
   * it, so repeating two things in a row gives the second one a full window
   * instead of inheriting what was left of the first.
   */
  token: number;
  onUndo: () => void;
  onExpire: () => void;
  durationMs?: number;
};

/**
 * The safety net under a one-tap write.
 *
 * Saving immediately is what makes repeating a habit two interactions instead
 * of three; this is what keeps that from being reckless. It sits at the bottom
 * edge of a tab screen, which the navigator has already inset above the tab
 * bar, so `bottom-0` is genuinely just above it.
 */
export function UndoBar({
  message,
  actionLabel,
  token,
  onUndo,
  onExpire,
  durationMs = 5000,
}: UndoBarProps) {
  useEffect(() => {
    const timer = setTimeout(onExpire, durationMs);
    return () => clearTimeout(timer);
  }, [token, durationMs, onExpire]);

  return (
    <View className="absolute inset-x-4 bottom-4 flex-row items-center gap-3 rounded-2xl border border-line bg-elevated px-4 py-3">
      <Text numberOfLines={1} className="flex-1 text-sm text-fg">
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onUndo}
        // Bigger than it looks: this is a five-second window, so a near miss
        // costs the user the only chance they get.
        hitSlop={12}
        className="active:opacity-60"
      >
        <Text className="text-sm font-bold text-primary">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
