import { Text, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "@/utils/cn";

type TextFieldSize = "default" | "large" | "multiline";

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
  size?: TextFieldSize;
};

// Full class strings per size rather than an override passed through
// className: cn only concatenates, so an `h-14` layered over the base `h-12`
// would leave both applied and the winner up to stylesheet order.
const SIZE_VARIANTS: Record<TextFieldSize, string> = {
  default: "h-12 px-4 text-base",
  large: "h-14 px-4 text-2xl font-bold",
  multiline: "h-24 px-4 py-3 text-base",
};

/** Labelled text input with an inline error slot. */
export function TextField({
  label,
  error,
  size = "default",
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <View className="flex-col gap-1.5">
      {label ? (
        <Text className="text-sm font-medium text-fg">{label}</Text>
      ) : null}

      <TextInput
        accessibilityLabel={label}
        placeholderTextColorClassName="accent-fg-muted"
        className={cn(
          "rounded-xl border bg-elevated text-fg",
          SIZE_VARIANTS[size],
          error ? "border-danger" : "border-line",
          className,
        )}
        {...inputProps}
      />

      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
