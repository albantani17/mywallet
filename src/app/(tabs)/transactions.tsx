import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";

export default function TransactionsTab() {
  const { t } = useTranslation();

  return (
    <Screen title={t("transactions.title")}>
      <EmptyState
        icon="receipt-outline"
        title={t("transactions.emptyTitle")}
        description={t("transactions.emptyDescription")}
      />
    </Screen>
  );
}
