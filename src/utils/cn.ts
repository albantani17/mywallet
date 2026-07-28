type ClassValue = string | false | null | undefined;

/**
 * Joins conditional className fragments. Uniwind resolves classes at build
 * time from the literal strings in the source, so every class must appear
 * whole somewhere — never build one by concatenating fragments.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
