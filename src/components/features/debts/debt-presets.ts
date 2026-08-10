import {
  toIonicon,
  type IoniconName,
} from "@/components/features/shared/icon-choices";
import type { DebtPreset } from "@/db";

/** Shown for a preset with no glyph of its own. */
export const FALLBACK_PRESET_ICON: IoniconName = "card-outline";

/**
 * Slug → translation key for the seeded presets.
 *
 * Written out rather than built as `debts.presets.${slug}`: the i18n keys are
 * compile-checked, and a template literal defeats that check — the day a slug
 * is renamed we want a type error here, not a raw key on screen.
 */
export const BUILT_IN_PRESET_LABEL_KEYS = {
  paylater: "debts.presets.paylater",
  "credit-card": "debts.presets.credit-card",
  "bank-loan": "debts.presets.bank-loan",
  "asset-financing": "debts.presets.asset-financing",
  "personal-loan": "debts.presets.personal-loan",
  "personal-lending": "debts.presets.personal-lending",
} as const;

export type BuiltInPresetSlug = keyof typeof BUILT_IN_PRESET_LABEL_KEYS;

export function presetLabelKey(
  preset: Pick<DebtPreset, "slug" | "isBuiltIn">,
): (typeof BUILT_IN_PRESET_LABEL_KEYS)[BuiltInPresetSlug] | null {
  if (!preset.isBuiltIn) return null;
  return BUILT_IN_PRESET_LABEL_KEYS[preset.slug as BuiltInPresetSlug] ?? null;
}

/** A missing or unknown glyph falls back to a card rather than crashing. */
export function toPresetIcon(icon: string | null | undefined): IoniconName {
  return toIonicon(icon, FALLBACK_PRESET_ICON);
}
