import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Dimensions, FlatList, View } from "react-native";

import { EmptyState } from "@/components/ui/empty-state";
import type { WalletWithBalance } from "@/db";
import { useWalletActions } from "@/hooks/features/wallets/use-wallet-actions";
import { useWalletFilters } from "@/hooks/features/wallets/use-wallet-filters";

import { WalletBalanceCard } from "./wallet-balance-card";
import { WalletCategorySheet } from "./wallet-category-sheet";
import { WalletCreateSheet } from "./wallet-create-sheet";
import { WalletCreateTile } from "./wallet-create-tile";
import { WalletDeleteSheet } from "./wallet-delete-sheet";
import { WalletEditSheet } from "./wallet-edit-sheet";
import { WalletGridCard } from "./wallet-grid-card";
import { WalletSearch } from "./wallet-search";
import { WalletTypeTabs } from "./wallet-type-tabs";

const H_PADDING = 24;
const GAP = 12;
const COLUMNS = 2;

/**
 * Cells get an explicit width rather than `flex-1`.
 *
 * With flex, a row holding a single cell sized it against a `flex-1` spacer
 * and came out wider than the full rows above it. A fixed width makes every
 * cell identical no matter how many share its row, and removes the need for
 * spacer padding altogether. Safe to read once at module scope because the app
 * is locked to portrait (app.json → orientation).
 */
const CELL_WIDTH =
  (Dimensions.get("window").width - H_PADDING * 2 - GAP * (COLUMNS - 1)) /
  COLUMNS;

/** Keeps a lone create tile the same height as the wallet cards above it. */
const CELL_MIN_HEIGHT = 148;

type GridItem =
  | { kind: "wallet"; wallet: WalletWithBalance }
  | { kind: "create" };

function buildGridData(wallets: WalletWithBalance[]): GridItem[] {
  const items: GridItem[] = wallets.map((wallet) => ({
    kind: "wallet",
    wallet,
  }));

  // No "last wallet" to follow when a filter matched nothing — the empty state
  // owns that case instead.
  if (items.length === 0) return items;

  items.push({ kind: "create" });

  return items;
}

export function WalletGrid() {
  const { t } = useTranslation();
  const {
    wallets,
    total,
    query,
    filter,
    setQuery,
    setFilter,
    isReady,
    hasWallets,
  } = useWalletFilters();

  const { activeWallet, isEditOpen, isDeleteOpen, edit, remove, close } =
    useWalletActions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  if (!isReady) {
    return (
      <View className="flex-1 flex-col items-center justify-center">
        <ActivityIndicator colorClassName="accent-fg" />
      </View>
    );
  }

  return (
    <>
      <FlatList<GridItem>
        data={buildGridData(wallets)}
        numColumns={2}
        keyExtractor={(item) =>
          item.kind === "wallet" ? `wallet-${item.wallet.id}` : "create"
        }
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{
          paddingHorizontal: H_PADDING,
          paddingBottom: 24,
          gap: GAP,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="flex-col gap-3">
            <WalletSearch value={query} onChange={setQuery} />
            <WalletTypeTabs
              value={filter}
              onChange={setFilter}
              onAddCategory={() => setIsCategoryOpen(true)}
            />
            <WalletBalanceCard total={total} />
          </View>
        }
        renderItem={({ item }) => (
          // The wrapper owns the geometry so every cell matches, whether its
          // row is full or holds a single tile.
          <View style={{ width: CELL_WIDTH, minHeight: CELL_MIN_HEIGHT }}>
            {item.kind === "wallet" ? (
              <WalletGridCard
                wallet={item.wallet}
                onEdit={edit}
                onDelete={remove}
              />
            ) : (
              <WalletCreateTile onPress={() => setIsCreateOpen(true)} />
            )}
          </View>
        )}
        ListEmptyComponent={
          hasWallets ? (
            // Wallets exist, but the search or the category tab excluded them.
            <EmptyState
              icon="search-outline"
              title={t("wallets.noResultsTitle")}
              description={t("wallets.noResultsDescription")}
            />
          ) : (
            <EmptyState
              icon="wallet-outline"
              title={t("wallets.emptyTitle")}
              description={t("wallets.emptyDescription")}
            />
          )
        }
      />

      <WalletCreateSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <WalletCategorySheet
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
      />

      {/* One sheet at grid level rather than one per card — and keyed by wallet
          so switching wallets remounts the form instead of reusing state. */}
      {activeWallet ? (
        <>
          <WalletEditSheet
            key={`edit-${activeWallet.id}`}
            wallet={activeWallet}
            isOpen={isEditOpen}
            onClose={close}
          />
          <WalletDeleteSheet
            key={`delete-${activeWallet.id}`}
            wallet={activeWallet}
            isOpen={isDeleteOpen}
            onClose={close}
            onRemoved={close}
          />
        </>
      ) : null}
    </>
  );
}
