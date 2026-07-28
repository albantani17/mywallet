import { useTranslation } from "react-i18next";

import { WalletGrid } from "@/components/features/wallets/wallet-grid";
import { Screen } from "@/components/ui/screen";

export default function WalletsTab() {
  const { t } = useTranslation();

  // Deliberately not `scrollable`: WalletGrid is a FlatList, and nesting it in
  // the ScrollView that prop turns on breaks scrolling.
  return (
    <Screen title={t("wallets.title")}>
      <WalletGrid />
    </Screen>
  );
}
