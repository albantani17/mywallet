import {
  toIonicon,
  type IoniconName,
} from "@/components/features/shared/icon-choices";
import type { CategoryType } from "@/db";

export {
  COLOR_CHOICES,
  FALLBACK_COLOR,
  TINT_ALPHA,
} from "@/components/features/shared/icon-choices";

/** Shown for a category row with no glyph of its own. */
export const FALLBACK_ICON: IoniconName = "pricetag-outline";

/** Category-flavoured binding of the shared cast. */
export function toIconName(icon: string | null | undefined): IoniconName {
  return toIonicon(icon, FALLBACK_ICON);
}

export type TransactionCategorySeed = {
  slug: string;
  name: string;
  type: CategoryType;
  icon: IoniconName;
  color: string;
};

/**
 * Seeds for the built-in transaction categories.
 *
 * Inserted into `categories` on launch rather than read here at render time —
 * the table is the source of truth once seeded. `name` is only a fallback,
 * since built-ins take their label from BUILT_IN_LABEL_KEYS and stay
 * translated. Slugs are the stable identity and must never be renamed.
 *
 * Order within the array becomes `sortOrder`, which is how the pickers order
 * them; user categories land after the built-ins of their type.
 */
export const BUILT_IN_TRANSACTION_CATEGORY_SEEDS: TransactionCategorySeed[] = [
  // Expense
  { slug: "food-drink", name: "Food & Drink", type: "expense", icon: "restaurant-outline", color: "#d97706" },
  { slug: "transport", name: "Transport", type: "expense", icon: "car-outline", color: "#2563eb" },
  { slug: "shopping", name: "Shopping", type: "expense", icon: "bag-handle-outline", color: "#db2777" },
  { slug: "groceries", name: "Groceries", type: "expense", icon: "cart-outline", color: "#65a30d" },
  { slug: "health", name: "Health", type: "expense", icon: "medkit-outline", color: "#dc2626" },
  { slug: "entertainment", name: "Entertainment", type: "expense", icon: "game-controller-outline", color: "#7c3aed" },
  { slug: "education", name: "Education", type: "expense", icon: "school-outline", color: "#0891b2" },
  { slug: "other-expense", name: "Other", type: "expense", icon: "ellipsis-horizontal-outline", color: "#8a978c" },

  // Income
  { slug: "salary", name: "Salary", type: "income", icon: "briefcase-outline", color: "#2f7d57" },
  { slug: "bonus", name: "Bonus", type: "income", icon: "sparkles-outline", color: "#d97706" },
  { slug: "investment-income", name: "Investment", type: "income", icon: "trending-up-outline", color: "#2563eb" },
  { slug: "gift", name: "Gift", type: "income", icon: "gift-outline", color: "#db2777" },
  { slug: "other-income", name: "Other", type: "income", icon: "ellipsis-horizontal-outline", color: "#8a978c" },

  // Bill
  { slug: "electricity", name: "Electricity", type: "bill", icon: "flash-outline", color: "#d97706" },
  { slug: "water", name: "Water", type: "bill", icon: "water-outline", color: "#0891b2" },
  { slug: "internet", name: "Internet", type: "bill", icon: "wifi-outline", color: "#2563eb" },
  { slug: "phone", name: "Phone", type: "bill", icon: "phone-portrait-outline", color: "#7c3aed" },
  { slug: "rent", name: "Rent", type: "bill", icon: "home-outline", color: "#2f7d57" },
  { slug: "insurance", name: "Insurance", type: "bill", icon: "shield-checkmark-outline", color: "#65a30d" },
  { slug: "installment", name: "Installment", type: "bill", icon: "card-outline", color: "#dc2626" },
  { slug: "subscription", name: "Subscription", type: "bill", icon: "repeat-outline", color: "#db2777" },
  { slug: "other-bill", name: "Other", type: "bill", icon: "ellipsis-horizontal-outline", color: "#8a978c" },
];

/**
 * Explicit slug → i18n key map. A `transactions.categories.${slug}` template
 * does not satisfy the typed i18n keys now that a slug is any string, and this
 * way an unrecognised built-in falls back to its stored name rather than
 * rendering a raw key. See use-wallet-categories for the same pattern.
 */
export const BUILT_IN_LABEL_KEYS = {
  "food-drink": "transactions.categories.foodDrink",
  transport: "transactions.categories.transport",
  shopping: "transactions.categories.shopping",
  groceries: "transactions.categories.groceries",
  health: "transactions.categories.health",
  entertainment: "transactions.categories.entertainment",
  education: "transactions.categories.education",
  "other-expense": "transactions.categories.other",
  salary: "transactions.categories.salary",
  bonus: "transactions.categories.bonus",
  "investment-income": "transactions.categories.investment",
  gift: "transactions.categories.gift",
  "other-income": "transactions.categories.other",
  electricity: "transactions.categories.electricity",
  water: "transactions.categories.water",
  internet: "transactions.categories.internet",
  phone: "transactions.categories.phone",
  rent: "transactions.categories.rent",
  insurance: "transactions.categories.insurance",
  installment: "transactions.categories.installment",
  subscription: "transactions.categories.subscription",
  "other-bill": "transactions.categories.other",
} as const;

/** Offered when creating a transaction category. */
export const ICON_CHOICES: IoniconName[] = [
  "pricetag-outline",
  "restaurant-outline",
  "cafe-outline",
  "cart-outline",
  "bag-handle-outline",
  "car-outline",
  "bus-outline",
  "airplane-outline",
  "home-outline",
  "flash-outline",
  "water-outline",
  "wifi-outline",
  "phone-portrait-outline",
  "medkit-outline",
  "fitness-outline",
  "school-outline",
  "game-controller-outline",
  "musical-notes-outline",
  "gift-outline",
  "briefcase-outline",
  "trending-up-outline",
  "card-outline",
  "repeat-outline",
  "paw-outline",
];
