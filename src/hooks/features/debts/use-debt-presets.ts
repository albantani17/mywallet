import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { presetLabelKey } from "@/components/features/debts/debt-presets";
import { debtPresetQueries, schema } from "@/db";
import type { DebtDirection, DebtPreset } from "@/db";
import { useLiveData } from "@/hooks/use-live-data";

/**
 * The financial products a new debt can start from.
 *
 * A preset only fills the form in — nothing here decides anything. The list is
 * live because a user-made preset should appear without a reload.
 */
export function useDebtPresets() {
  const { t } = useTranslation();
  const { data, updatedAt } = useLiveData(debtPresetQueries.list(), [
    schema.debtPresets,
  ]);

  const presets = data ?? [];

  /** Built-ins stay translated; a preset the user made keeps its typed name. */
  const labelOf = useCallback(
    (preset: DebtPreset) => {
      const key = presetLabelKey(preset);
      return key ? t(key) : preset.name;
    },
    [t],
  );

  const byDirection = useCallback(
    (direction: DebtDirection) =>
      presets.filter((preset) => preset.direction === direction),
    [presets],
  );

  return {
    presets,
    byDirection,
    labelOf,
    isReady: updatedAt !== undefined,
  };
}
