import type { ReactNode } from "react";
import { ScrollView, Text, View, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/utils/cn";

type ScreenProps = {
  children: ReactNode;
  title?: string;
  /** Wraps the content in a ScrollView. Off for screens that scroll their own. */
  scrollable?: boolean;
  /** Pull-to-refresh, only meaningful together with `scrollable`. */
  refreshControl?: ScrollViewProps["refreshControl"];
  /**
   * Pinned above the content rather than inside it — an undo bar, a toast.
   * A sibling of the container, so it stays put while the content scrolls.
   */
  overlay?: ReactNode;
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
  refreshControl,
  overlay,
  className,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const Container = scrollable ? ScrollView : View;

  return (
    <View className="flex-1 flex-col bg-canvas">
      <Container
        className={cn("flex-1", className)}
        contentContainerClassName={scrollable ? "pb-8" : undefined}
        style={{ paddingTop: insets.top + 12 }}
        showsVerticalScrollIndicator={false}
        // A plain View would reject the prop outright, so it is only passed on
        // when this screen actually scrolls.
        refreshControl={scrollable ? refreshControl : undefined}
      >
        {title ? (
          <Text className="px-6 pb-4 text-2xl font-extrabold text-fg">
            {title}
          </Text>
        ) : null}
        {children}
      </Container>
      {overlay}
    </View>
  );
}
