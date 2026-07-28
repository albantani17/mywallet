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
        <Text className="text-sm font-medium text-brand-logo-fg">{label}</Text>
      ) : null}

      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8a978c"
        className={cn(
          "h-12 rounded-xl border bg-white px-4 text-base text-brand-logo-fg",
          error ? "border-red-500" : "border-black/10",
          className,
        )}
        {...inputProps}
      />

      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
