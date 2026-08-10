import { useTranslation } from "react-i18next";

import { SearchField } from "@/components/ui/search-field";

type WalletSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function WalletSearch({ value, onChange }: WalletSearchProps) {
  const { t } = useTranslation();

  return (
    <SearchField
      value={value}
      onChange={onChange}
      placeholder={t("wallets.searchPlaceholder")}
      // Sits on the canvas rather than inside a panel, so it takes the panel
      // colour instead of the default control colour.
      className="bg-surface"
    />
  );
}
