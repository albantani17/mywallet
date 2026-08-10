import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import { WalletCard } from "@/components/features/wallets/wallet-card";
import type { WalletWithBalance } from "@/db";
import { useThemeColors } from "@/hooks/use-theme-colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.875);
const GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + GAP;
// Centres the first and last card instead of leaving them flush to the edge.
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

type WalletCarouselProps = {
  wallets: WalletWithBalance[];
  /** Appends a tile linking to the full wallet list as the last slide. */
  showMore?: boolean;
};

export function WalletCarousel({
  wallets,
  showMore = false,
}: WalletCarouselProps) {
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  // The more tile is a slide like any other, so the dots count slides rather
  // than wallets — otherwise the last slide has no dot.
  const slideCount = wallets.length + (showMore ? 1 : 0);

  return (
    <View className="flex-col">
      <Animated.ScrollView
        horizontal
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
          gap: GAP,
        }}
      >
        {wallets.map((wallet, index) => (
          <Slide key={wallet.id} index={index} scrollX={scrollX}>
            <WalletCard wallet={wallet} />
          </Slide>
        ))}

        {showMore ? (
          <Slide index={wallets.length} scrollX={scrollX}>
            <MoreTile />
          </Slide>
        ) : null}
      </Animated.ScrollView>

      {slideCount > 1 ? (
        <View className="mt-4 flex-row items-center justify-center gap-2">
          {Array.from({ length: slideCount }, (_, index) => (
            <Dot key={index} index={index} scrollX={scrollX} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Distance of a slide from the centre drives its scale and opacity. */
function slideRange(index: number) {
  "worklet";
  return [
    (index - 1) * SNAP_INTERVAL,
    index * SNAP_INTERVAL,
    (index + 1) * SNAP_INTERVAL,
  ];
}

type SlideProps = {
  index: number;
  scrollX: SharedValue<number>;
  children: ReactNode;
};

function Slide({ index, scrollX, children }: SlideProps) {
  const style = useAnimatedStyle(() => {
    const inputRange = slideRange(index);

    return {
      transform: [
        {
          scale: interpolate(
            scrollX.value,
            inputRange,
            [0.93, 1, 0.93],
            "clamp",
          ),
        },
      ],
      opacity: interpolate(scrollX.value, inputRange, [0.6, 1, 0.6], "clamp"),
    };
  });

  return (
    <Animated.View style={[{ width: CARD_WIDTH }, style]}>
      {children}
    </Animated.View>
  );
}

function MoreTile() {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <Link href="/wallets" asChild>
      <Pressable
        accessibilityRole="button"
        className="flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-line bg-surface p-5 active:opacity-70"
      >
        <View className="size-12 flex-col items-center justify-center rounded-full bg-elevated">
          <Ionicons name="arrow-forward" size={22} color={colors.primary} />
        </View>
        <Text className="text-sm font-semibold text-fg">
          {t("dashboard.seeAll")}
        </Text>
      </Pressable>
    </Link>
  );
}

function Dot({ index, scrollX }: Omit<SlideProps, "children">) {
  const style = useAnimatedStyle(() => {
    const inputRange = slideRange(index);

    return {
      width: interpolate(scrollX.value, inputRange, [6, 18, 6], "clamp"),
      opacity: interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], "clamp"),
    };
  });

  return (
    <Animated.View className="h-1.5 rounded-full bg-elevated" style={style} />
  );
}
