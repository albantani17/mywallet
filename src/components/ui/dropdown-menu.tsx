import { Ionicons } from "@expo/vector-icons";
import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Dimensions, Modal, Pressable, Text, View } from "react-native";

import { cn } from "@/utils/cn";
import { useThemeColors } from "@/hooks/use-theme-colors";

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
  /**
   * Draw the menu as wide as its trigger and left-align it. What a select
   * wants: a 168px menu hanging off the right edge of a full-width field reads
   * as a stray popover rather than as that field's options.
   */
  matchTriggerWidth?: boolean;
  /** Marks one item as the current value, the way a select does. */
  selectedKey?: string;
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
  matchTriggerWidth = false,
  selectedKey,
}: DropdownMenuProps) {
  const colors = useThemeColors();
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
        <Pressable className="flex-1 bg-scrim" onPress={close}>
          {anchor ? (
            <View
              className="absolute flex-col rounded-2xl bg-elevated py-1.5"
              style={[
                menuPosition(
                  anchor,
                  items.length,
                  matchTriggerWidth ? anchor.width : MENU_WIDTH,
                  matchTriggerWidth,
                ),
                {
                  width: matchTriggerWidth ? anchor.width : MENU_WIDTH,
                  // Elevation is Android's shadow; shadowColor covers iOS.
                  elevation: 8,
                  shadowColor: "#000",
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                },
              ]}
            >
              {items.map((item) => {
                const isSelected = item.key === selectedKey;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      close();
                      item.onPress();
                    }}
                    className="flex-row items-center gap-3 px-4 py-3 active:bg-elevated"
                  >
                    {item.icon ? (
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={
                          item.destructive
                            ? colors.danger
                            : isSelected
                              ? colors.primary
                              : colors.fg
                        }
                      />
                    ) : null}
                    <Text
                      className={cn(
                        "flex-1 text-sm font-semibold",
                        item.destructive
                          ? "text-danger"
                          : isSelected
                            ? "text-primary"
                            : "text-fg",
                      )}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

function menuPosition(
  anchor: Anchor,
  itemCount: number,
  width: number,
  alignLeft: boolean,
) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const menuHeight = itemCount * ITEM_HEIGHT + 12;

  // A field-width menu sits directly over its field; a narrow one hangs off the
  // trigger's right edge. Either way it is then clamped to the screen.
  const preferredLeft = alignLeft ? anchor.x : anchor.x + anchor.width - width;
  const left = Math.min(
    Math.max(EDGE, preferredLeft),
    screenWidth - width - EDGE,
  );

  const below = anchor.y + anchor.height + OFFSET;
  const fitsBelow = below + menuHeight <= screenHeight - EDGE;
  const top = fitsBelow ? below : Math.max(EDGE, anchor.y - menuHeight - OFFSET);

  return { left, top };
}
