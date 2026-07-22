/**
 * Format bilangan bulat rupiah menjadi string berpemisah ribuan, mis.
 * `1234567` → `"Rp 1.234.567"`. Ditulis manual (bukan `Intl.NumberFormat`)
 * karena dukungan Intl di Hermes tidak lengkap. Nilai disimpan sebagai
 * integer IDR tanpa sen.
 */
export function formatIDR(amount: number): string {
  const rounded = Math.trunc(amount);
  const sign = rounded < 0 ? "-" : "";
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}Rp ${digits}`;
}
