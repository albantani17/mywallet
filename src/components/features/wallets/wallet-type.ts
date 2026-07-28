import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import { WALLET_TYPES, type WalletType } from "@/db";
import type { Translation } from "@/i18n/locales/id";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const WALLET_TYPE_ICONS: Record<WalletType, IoniconName> = {
  cash: "cash-outline",
  bank: "business-outline",
  ewallet: "phone-portrait-outline",
  investment: "trending-up-outline",
};

/**
 * Accent per type, as a hex string rather than a Tailwind class: it feeds
 * `<Ionicons color>` directly, and the tint circle uses it via an inline
 * backgroundColor. Arbitrary-value classes (`bg-[#2f7d57]/15`) are the
 * construct that silently failed in the old type picker, so avoid them here.
 */
export const WALLET_TYPE_COLORS: Record<WalletType, string> = {
  cash: "#2f7d57",
  bank: "#2563eb",
  ewallet: "#7c3aed",
  investment: "#d97706",
};

/** ~15% alpha suffix for the logo circle behind the icon. */
export const TINT_ALPHA = "26";

/** Keys into `wallets.types.*`, kept in the schema's own order. */
export const WALLET_TYPE_OPTIONS: {
  value: WalletType;
  icon: IoniconName;
  labelKey: keyof Translation["wallets"]["types"];
}[] = WALLET_TYPES.map((value) => ({
  value,
  icon: WALLET_TYPE_ICONS[value],
  labelKey: value,
}));
