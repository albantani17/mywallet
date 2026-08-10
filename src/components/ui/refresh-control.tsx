import { RefreshControl, type RefreshControlProps } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";

type AppRefreshControlProps = Omit<
  RefreshControlProps,
  "refreshing" | "onRefresh"
> & {
  isRefreshing: boolean;
  onRefresh: () => void;
};

/**
 * RefreshControl in the app's palette.
 *
 * `...rest` is not optional politeness — it is load-bearing. On Android a
 * ScrollView given a `refreshControl` does not render it as a child: it clones
 * that element and passes the whole scroll view in as `children`, plus the
 * outer layout `style` (see ScrollView.js). A wrapper that names only its own
 * props therefore throws the entire screen away and renders an empty
 * SwipeRefreshLayout. Everything RN injects has to reach the real control.
 *
 * The spinner is drawn natively, so it cannot be reached with a className —
 * iOS reads `tintColor`, Android `colors` and `progressBackgroundColor`. Left
 * to the platform defaults it renders grey on grey in dark mode.
 */
export function AppRefreshControl({
  isRefreshing,
  onRefresh,
  ...rest
}: AppRefreshControlProps) {
  const colors = useThemeColors();

  return (
    <RefreshControl
      {...rest}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
      progressBackgroundColor={colors.surface}
    />
  );
}
