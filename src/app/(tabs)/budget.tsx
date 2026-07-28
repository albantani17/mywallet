import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/ui/empty-state";
import { Screen } from "@/components/ui/screen";

export default function BudgetTab() {
  const { t } = useTranslation();

  return (
    <Screen title={t("budget.title")}>
      <EmptyState
        icon="pie-chart-outline"
        title={t("budget.comingSoonTitle")}
        description={t("budget.comingSoonDescription")}
      />
    </Screen>
  );
}
