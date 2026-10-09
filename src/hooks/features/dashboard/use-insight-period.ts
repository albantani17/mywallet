import { useCallback, useState } from "react";

import type { InsightPeriod } from "@/services/insight";
import { startOfMonth } from "@/utils/format-date";

export type InsightPeriodSelection = {
  period: InsightPeriod;
  customFrom: Date | null;
  customTo: Date | null;
};

/**
 * Which window the insights look at.
 *
 * Only the raw choice is held — the bounds are resolved by useInsights on each
 * mount, so "this month" never freezes at whatever day it was picked on.
 * Session-only on purpose: opening the app should answer "how is this month
 * going" before anything else.
 */
export function useInsightPeriod() {
  const [period, setPeriodValue] = useState<InsightPeriod>("thisMonth");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const setPeriod = useCallback((next: InsightPeriod) => {
    setPeriodValue(next);

    if (next === "custom") {
      // Starts from this month rather than empty, so the chart has something to
      // show the moment the preset is picked.
      const now = new Date();
      setCustomFrom((current) => current ?? startOfMonth(now));
      setCustomTo((current) => current ?? now);
    } else {
      setCustomFrom(null);
      setCustomTo(null);
    }
  }, []);

  return {
    selection: { period, customFrom, customTo } satisfies InsightPeriodSelection,
    setPeriod,
    setCustomFrom,
    setCustomTo,
  };
}

export type InsightPeriodControls = ReturnType<typeof useInsightPeriod>;
