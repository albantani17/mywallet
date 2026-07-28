import { useEffect, type ReactNode } from "react";
import {
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  type KeyboardEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const DURATION = 220;
/** Leaves the sheet short of the status bar even with a tall form open. */
const MAX_HEIGHT_RATIO = 0.9;

/**
 * Sheet that slides up from the bottom edge.
 *
 * Built on RN's Modal rather than @gorhom/bottom-sheet: that library rendered
 * blank under reanimated 4 in this project, and a plain slide-up needs none of
 * its gesture machinery. `animationType="none"` because the translateY below
 * owns the animation.
 *
 * The keyboard is handled by hand rather than with KeyboardAvoidingView. On
 * Android a Modal is its own window, so `adjustResize` never reaches it and
 * KeyboardAvoidingView has nothing to react to — the sheet simply sat under
 * the keyboard. Listening to the keyboard events and lifting the sheet works
 * on both platforms.
 */
export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const keyboardLift = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, { duration: DURATION });
  }, [isOpen, progress]);

  useEffect(() => {
    // iOS fires the "will" events ahead of the animation, which tracks the
    // keyboard more smoothly; Android only has the "did" pair.
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (event: KeyboardEvent) => {
      // The sheet already pads by insets.bottom, and that padding ends up
      // behind the keyboard — subtracting it avoids lifting twice and leaving
      // a gap between the sheet and the keyboard.
      const lift = Math.max(0, event.endCoordinates.height - insets.bottom);
      keyboardLift.value = withTiming(lift, { duration: DURATION });
    };

    const onHide = () => {
      keyboardLift.value = withTiming(0, { duration: DURATION });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, keyboardLift]);

  // Reset the lift when the sheet closes, so reopening never starts raised.
  useEffect(() => {
    if (!isOpen) keyboardLift.value = 0;
  }, [isOpen, keyboardLift]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - progress.value) * 32 - keyboardLift.value },
    ],
    opacity: progress.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      // Android hardware back button.
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-col justify-end">
        <Animated.View
          className="absolute inset-0 bg-black/60"
          style={backdropStyle}
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        <Animated.View
          className="flex-col rounded-t-3xl bg-brand-sheet px-6 pt-3"
          style={[
            {
              paddingBottom: insets.bottom + 24,
              maxHeight:
                Dimensions.get("window").height * MAX_HEIGHT_RATIO,
            },
            sheetStyle,
          ]}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-black/10" />

          {/* flexGrow 0 lets the ScrollView size to its content and only start
              scrolling once maxHeight is hit — otherwise it would collapse. */}
          <ScrollView
            style={{ flexGrow: 0 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
