import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/utils/cn";

type ScreenProps = {
  children: ReactNode;
  title?: string;
  /** Wraps the content in a ScrollView. Off for screens that scroll their own. */
  scrollable?: boolean;
  className?: string;
};

/**
 * Brand canvas with the top safe-area inset applied. The bottom inset is left
 * to the tab bar, which draws over it.
 */
export function Screen({
  children,
  title,
  scrollable = false,
  className,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const Container = scrollable ? ScrollView : View;

  return (
    <View className="flex-1 flex-col bg-brand-canvas">
      <Container
        className={cn("flex-1", className)}
        contentContainerClassName={scrollable ? "pb-8" : undefined}
        style={{ paddingTop: insets.top + 12 }}
        showsVerticalScrollIndicator={false}
      >
        {title ? (
          <Text className="px-6 pb-4 text-2xl font-extrabold text-white">
            {title}
          </Text>
        ) : null}
        {children}
      </Container>
    </View>
  );
}
