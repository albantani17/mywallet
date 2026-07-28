import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";

import { cn } from "@/utils/cn";

export type DropdownMenuItem = {
  key: string;
  label: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  destructive?: boolean;
  onPress: () => void;
};

type DropdownMenuProps = {
  items: DropdownMenuItem[];
  trigger: ReactNode;
  accessibilityLabel: string;
};

const MENU_WIDTH = 168;
const ITEM_HEIGHT = 44;
const EDGE = 8;
const OFFSET = 6;

type Anchor = { x: number; y: number; width: number; height: number };

/**
 * Menu anchored to its own trigger.
 *
 * The trigger measures itself in window coordinates and the menu is drawn at
 * those coordinates inside a transparent Modal. It right-aligns to the
 * trigger, is clamped to the screen, and flips above when there is no room
 * below — without that, a kebab on a right-column or bottom-row grid cell
 * would render partly off-screen.
 */
export function DropdownMenu({
  items,
  trigger,
  accessibilityLabel,
}: DropdownMenuProps) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  };

  const close = () => setAnchor(null);

  return (
    <>
      <Pressable
        ref={triggerRef}
        // Android can flatten a plain View out of the tree, losing measurement.
        collapsable={false}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={open}
        hitSlop={10}
      >
        {trigger}
      </Pressable>

      <Modal
        visible={anchor !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}
      >
        <Pressable className="flex-1 bg-black/20" onPress={close}>
          {anchor ? (
            <View
              className="absolute flex-col rounded-2xl bg-white py-1.5"
              style={[
                menuPosition(anchor, items.length),
                {
                  width: MENU_WIDTH,
                  // Elevation is Android's shadow; shadowColor covers iOS.
                  elevation: 8,
                  shadowColor: "#000",
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                },
              ]}
            >
              {items.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  onPress={() => {
                    close();
                    item.onPress();
                  }}
                  className="flex-row items-center gap-3 px-4 py-3 active:bg-black/5"
                >
                  {item.icon ? (
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.destructive ? "#dc2626" : "#1f3d2b"}
                    />
                  ) : null}
                  <Text
                    className={cn(
                      "text-sm font-semibold",
                      item.destructive ? "text-red-600" : "text-brand-logo-fg",
                    )}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

function menuPosition(anchor: Anchor, itemCount: number) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const menuHeight = itemCount * ITEM_HEIGHT + 12;

  // Right-align to the trigger, then keep the whole menu on screen.
  const preferredLeft = anchor.x + anchor.width - MENU_WIDTH;
  const left = Math.min(
    Math.max(EDGE, preferredLeft),
    screenWidth - MENU_WIDTH - EDGE,
  );

  const below = anchor.y + anchor.height + OFFSET;
  const fitsBelow = below + menuHeight <= screenHeight - EDGE;
  const top = fitsBelow ? below : Math.max(EDGE, anchor.y - menuHeight - OFFSET);

  return { left, top };
}
