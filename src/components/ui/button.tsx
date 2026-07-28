import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  isDisabled?: boolean;
  isLoading?: boolean;
  /** Rendered to the left of the label — an icon, usually. */
  startContent?: ReactNode;
  className?: string;
};

// Full class strings per variant: Uniwind resolves classes from the literal
// text in the source, so these can never be assembled from fragments.
const CONTAINER_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-elevated border border-line",
  ghost: "bg-transparent",
  destructive: "bg-danger",
};

// primary and destructive sit on a solid fill, so their label follows the fill
// rather than the theme — text-fg would vanish into green in light mode.
const LABEL_VARIANTS: Record<ButtonVariant, string> = {
  primary: "text-primary-fg",
  secondary: "text-fg",
  ghost: "text-fg-muted",
  destructive: "text-primary-fg",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  isDisabled = false,
  isLoading = false,
  startContent,
  className,
}: ButtonProps) {
  const isInert = isDisabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInert }}
      disabled={isInert}
      onPress={onPress}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-2xl px-5 py-4",
        CONTAINER_VARIANTS[variant],
        isInert && "opacity-50",
        // Android has no hover; active gives the press feedback.
        !isInert && "active:opacity-80",
        className,
      )}
    >
      {isLoading ? (
        <ActivityIndicator size="small" colorClassName={LABEL_VARIANTS[variant]} />
      ) : (
        <>
          {startContent ? <View>{startContent}</View> : null}
          <Text className={cn("text-base font-semibold", LABEL_VARIANTS[variant])}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
