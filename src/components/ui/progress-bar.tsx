import { View } from "react-native";

import { cn } from "@/utils/cn";

type ProgressBarTone = "primary" | "muted";

type ProgressBarProps = {
  /** 0..1. Anything outside is clamped rather than overflowing the track. */
  ratio: number;
  tone?: ProgressBarTone;
};

// Full class strings per tone: cn only concatenates, so a colour layered over
// another would leave both applied and the winner up to stylesheet order.
const FILL_TONES: Record<ProgressBarTone, string> = {
  primary: "h-full rounded-full bg-primary",
  muted: "h-full rounded-full bg-fg-muted",
};

/**
 * A filled bar. The width has to be an inline style rather than a class —
 * Uniwind resolves classes from the literal text in the source, so a computed
 * `w-[47%]` would resolve to nothing.
 */
export function ProgressBar({ ratio, tone = "primary" }: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      className="h-2 w-full overflow-hidden rounded-full bg-elevated"
    >
      <View className={cn(FILL_TONES[tone])} style={{ width: `${percent}%` }} />
    </View>
  );
}
