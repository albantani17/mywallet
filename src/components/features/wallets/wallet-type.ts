import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { BUILT_IN_WALLET_TYPES } from "@/db";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/** ~15% alpha suffix for the logo circle behind an icon. */
export const TINT_ALPHA = "26";

/** Shown for a slug with no matching row — a deleted category, say. */
export const FALLBACK_ICON: IoniconName = "wallet-outline";
export const FALLBACK_COLOR = "#8a978c";

/**
 * Seeds for the four built-in categories.
 *
 * These are inserted into `wallet_categories` on launch rather than read from
 * here at render time — the table is the source of truth once seeded. Their
 * `name` is only a fallback, since built-ins take their label from
 * `wallets.types.<slug>` and stay translated.
 */
export const BUILT_IN_CATEGORY_SEEDS: {
  slug: string;
  name: string;
  icon: IoniconName;
  color: string;
  sortOrder: number;
}[] = [
  { slug: "cash", name: "Cash", icon: "cash-outline", color: "#2f7d57", sortOrder: 0 },
  { slug: "bank", name: "Bank", icon: "business-outline", color: "#2563eb", sortOrder: 1 },
  {
    slug: "ewallet",
    name: "E-Wallet",
    icon: "phone-portrait-outline",
    color: "#7c3aed",
    sortOrder: 2,
  },
  {
    slug: "investment",
    name: "Investment",
    icon: "trending-up-outline",
    color: "#d97706",
    sortOrder: 3,
  },
];

const BUILT_IN_SLUGS = new Set<string>(BUILT_IN_WALLET_TYPES);

export function isBuiltInSlug(slug: string): boolean {
  return BUILT_IN_SLUGS.has(slug);
}

/**
 * The DB stores the glyph as free text; Ionicons types it as a union. Cast at
 * this single boundary — an unknown name renders nothing rather than throwing,
 * and the icon picker only ever writes names from ICON_CHOICES.
 */
export function toIconName(icon: string | null | undefined): IoniconName {
  return (icon ?? FALLBACK_ICON) as IoniconName;
}

/** Offered when creating a category. */
export const ICON_CHOICES: IoniconName[] = [
  "wallet-outline",
  "cash-outline",
  "card-outline",
  "business-outline",
  "phone-portrait-outline",
  "trending-up-outline",
  "logo-bitcoin",
  "gift-outline",
  "home-outline",
  "car-outline",
  "airplane-outline",
  "school-outline",
  "heart-outline",
  "briefcase-outline",
  "shield-checkmark-outline",
  "star-outline",
];

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
