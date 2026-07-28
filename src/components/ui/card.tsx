import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/utils/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
};

/** Cream panel on the brand canvas. */
export function Card({ children, className }: CardProps) {
  return (
    <View className={cn("flex-col rounded-3xl bg-brand-sheet p-5", className)}>
      {children}
    </View>
  );
}

/** Translucent panel for use directly on the canvas. */
export function SubtleCard({ children, className }: CardProps) {
  return (
    <View className={cn("flex-col rounded-3xl bg-white/10 p-5", className)}>
      {children}
    </View>
  );
}
