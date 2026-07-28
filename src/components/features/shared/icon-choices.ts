import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

/** ~15% alpha suffix for the logo circle behind an icon. */
export const TINT_ALPHA = "26";

/** Shown for a row whose colour is missing — a deleted category, say. */
export const FALLBACK_COLOR = "#8a978c";

/**
 * The swatches offered by every category form. Shared so a wallet category and
 * a transaction category cannot drift into two different palettes.
 */
export const COLOR_CHOICES = [
  "#2f7d57",
  "#2563eb",
  "#7c3aed",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

/**
 * The DB stores the glyph as free text; Ionicons types it as a union. Cast at
 * this single boundary — an unknown name renders nothing rather than throwing,
 * and the icon pickers only ever write names from their own choice list.
 */
export function toIonicon(
  icon: string | null | undefined,
  fallback: IoniconName,
): IoniconName {
  return (icon ?? fallback) as IoniconName;
}
