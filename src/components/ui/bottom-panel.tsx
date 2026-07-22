import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomPanelProps = {
  children: ReactNode;
  /** Class tambahan untuk container isi (mis. atur gap/padding). */
  className?: string;
};

/**
 * Panel bawah statis bergaya sheet (sudut atas membulat + handle pill),
 * selalu tampil dan tak bisa ditutup. Sengaja View statis — bukan
 * BottomSheet interaktif — agar andal (lihat [[bottomsheet-static-panel]]).
 */
export function BottomPanel({ children, className }: BottomPanelProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-brand-sheet">
      <View className="items-center pt-3">
        <View className="h-1 w-9 rounded-full bg-black/15" />
      </View>
      <View
        className={`gap-3 px-5 pt-4 ${className ?? ""}`}
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {children}
      </View>
    </View>
  );
}
