import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";

import { useThemeColors } from "@/hooks/use-theme-colors";
import { cn } from "@/utils/cn";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  className?: string;
};

/** Search box with a leading glass and a clear button once anything is typed. */
export function SearchField({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  className,
}: SearchFieldProps) {
  const colors = useThemeColors();

  return (
    <View
      className={cn(
        "flex-row items-center gap-2 rounded-2xl bg-elevated px-4",
        className,
      )}
    >
      <Ionicons name="search" size={18} color={colors.fgMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColorClassName="accent-fg-muted"
        returnKeyType="search"
        autoCorrect={false}
        autoFocus={autoFocus}
        className="h-12 flex-1 text-base text-fg"
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange("")}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={colors.fgMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
