import { Text, TextInput, View, type TextInputProps } from "react-native";

import { cn } from "@/utils/cn";

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string | null;
};

/** Labelled text input with an inline error slot. */
export function TextField({
  label,
  error,
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
        placeholderTextColorClassName="text-fg-muted"
        className={cn(
          "h-12 rounded-xl border bg-elevated px-4 text-base text-fg",
          error ? "border-danger" : "border-line",
          className,
        )}
        {...inputProps}
      />

      {error ? <Text className="text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
