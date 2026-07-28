import { useCSSVariable } from "uniwind";

/**
 * The theme palette as plain values, for the places a className cannot reach:
 * Ionicons `color=`, navigator options, and native pickers' `accentColor`.
 *
 * Every token here is also used as a className somewhere, which is what keeps
 * `useCSSVariable` from warning that it cannot find the variable — it only
 * resolves variables the bundler actually emitted.
 *
 * Prefer Uniwind's own escape hatches where they exist (`colorClassName` on
 * ActivityIndicator, `placeholderTextColorClassName` on TextInput) — they stay
 * declarative and re-render on their own.
 */
export function useThemeColors() {
  const [
    base,
    surface,
    elevated,
    fg,
    fgMuted,
    line,
    primary,
    primaryFg,
    danger,
  ] = useCSSVariable([
    "--color-base",
    "--color-surface",
    "--color-elevated",
    "--color-fg",
    "--color-fg-muted",
    "--color-line",
    "--color-primary",
    "--color-primary-fg",
    "--color-danger",
  ]);

  return {
    base: base as string,
    surface: surface as string,
    elevated: elevated as string,
    fg: fg as string,
    fgMuted: fgMuted as string,
    line: line as string,
    primary: primary as string,
    primaryFg: primaryFg as string,
    danger: danger as string,
  };
}
