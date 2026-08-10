import { BUILT_IN_WALLET_TYPES } from "@/db";
import {
  toIonicon,
  type IoniconName,
} from "@/components/features/shared/icon-choices";

export {
  COLOR_CHOICES,
  FALLBACK_COLOR,
  TINT_ALPHA,
} from "@/components/features/shared/icon-choices";

/** Shown for a slug with no matching row — a deleted category, say. */
export const FALLBACK_ICON: IoniconName = "wallet-outline";

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

/** Wallet-flavoured binding of the shared cast: a missing glyph is a wallet. */
export function toIconName(icon: string | null | undefined): IoniconName {
  return toIonicon(icon, FALLBACK_ICON);
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
