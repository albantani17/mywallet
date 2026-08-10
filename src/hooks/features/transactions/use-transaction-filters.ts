import { useCallback, useState } from "react";

import { endOfDay, startOfDay } from "@/utils/format-date";

export type TimeRange =
  | "all"
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "custom";

export type TransactionFilterValues = {
  search: string;
  walletId: number | null;
  from: Date | null;
  to: Date | null;
};

/**
 * Turns the chosen preset into a pair of bounds.
 *
 * `now` is passed in rather than read here so one render cannot straddle
 * midnight and produce a `from` and `to` that disagree about what today is.
 * The "last N days" windows count back N-1 days and include today, which is
 * what "7 hari terakhir" means to a reader — not 7 days ending yesterday.
 */
function resolveRange(
  range: TimeRange,
  now: Date,
  customFrom: Date | null,
  customTo: Date | null,
): { from: Date | null; to: Date | null } {
  switch (range) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "last7": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case "thisMonth":
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: endOfDay(now),
      };
    case "custom":
      // Either end may be left empty — "everything since March" is a range too.
      return {
        from: customFrom ? startOfDay(customFrom) : null,
        to: customTo ? endOfDay(customTo) : null,
      };
    case "all":
    default:
      return { from: null, to: null };
  }
}

/**
 * Search and filter state for the transactions screen.
 *
 * Only the raw inputs are held; the bounds are derived on each render. Storing
 * the resolved dates in state instead would freeze "today" at whatever it was
 * when the preset was picked.
 */
export function useTransactionFilters() {
  const [search, setSearch] = useState("");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [range, setRangeValue] = useState<TimeRange>("all");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const { from, to } = resolveRange(range, new Date(), customFrom, customTo);

  const setRange = useCallback((next: TimeRange) => {
    setRangeValue(next);
    // Leaving custom clears its dates, so returning to it later starts empty
    // rather than silently reapplying a range the user last used.
    if (next !== "custom") {
      setCustomFrom(null);
      setCustomTo(null);
    }
  }, []);

  return {
    // Raw inputs, for the controls.
    search,
    walletId,
    range,
    customFrom,
    customTo,
    setSearch,
    setWalletId,
    setRange,
    setCustomFrom,
    setCustomTo,
    // Resolved values, for the query.
    filters: { search, walletId, from, to } satisfies TransactionFilterValues,
    /**
     * Whether anything is narrowing the list. Lets the screen tell "no
     * transactions yet" apart from "nothing matched" without a second query
     * counting the unfiltered total.
     */
    isFiltered:
      search.trim() !== "" || walletId !== null || from !== null || to !== null,
  };
}
