import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { BUILT_IN_LABEL_KEYS } from "@/components/features/transactions/transaction-category";
import {
  categoryQueries,
  quickEntryAliasQueries,
  schema,
  type Category,
  type TransactionType,
} from "@/db";
import { useDefaultWallet } from "@/hooks/features/transactions/use-default-wallet";
import { useWallets } from "@/hooks/features/wallets/use-wallets";
import { useLiveData } from "@/hooks/use-live-data";
import { proposeAlias, type AliasProposal } from "@/services/quick-entry-alias";
import {
  parseTransaction,
  toCreateTransactionInput,
  type GuessedField,
  type ParsedDraft,
} from "@/services/quick-entry-parser";
import { quickEntryService } from "@/services/quick-entry-service";
import { transactionService } from "@/services/transaction-service";

/** The fields a chip in the interpretation row can correct. */
export type QuickEntryField = "type" | "amount" | "wallet" | "category" | "date";

type Overrides = {
  type?: TransactionType;
  amount?: number | null;
  walletId?: number | null;
  toWalletId?: number | null;
  categoryId?: number | null;
  occurredAt?: Date;
};

/**
 * A sentence turned into a transaction, live as it is typed.
 *
 * The parse is kept apart from the user's corrections on purpose: the
 * difference between the two is exactly what can be learnt, and merging them
 * would leave nothing to compare. Everything the parser needs is read here and
 * handed over as plain data, which is what keeps the parser itself testable
 * without a database.
 */
export function useQuickEntry() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [overrides, setOverrides] = useState<Overrides>({});
  const [shouldLearn, setShouldLearn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { wallets, isReady: walletsReady } = useWallets();
  const { data: categoryRows, updatedAt: categoriesAt } = useLiveData(
    categoryQueries.list(),
    [schema.categories],
    [],
  );
  const { data: aliasRows, updatedAt: aliasesAt } = useLiveData(
    quickEntryAliasQueries.list(),
    [schema.quickEntryAliases],
    [],
  );
  // Expense is the overwhelming majority, and the type is not known until the
  // sentence has been parsed — which needs this value to exist first.
  const defaultWallet = useDefaultWallet("expense");

  const categories = useMemo(() => categoryRows ?? [], [categoryRows]);

  const labelOf = useCallback(
    (category: Category): string => {
      if (!category.isBuiltIn) return category.name;
      const key =
        BUILT_IN_LABEL_KEYS[category.slug as keyof typeof BUILT_IN_LABEL_KEYS];
      return key ? t(key) : category.name;
    },
    [t],
  );

  const parsed: ParsedDraft = useMemo(
    () =>
      parseTransaction(text, {
        now: new Date(),
        wallets: wallets.map((wallet) => ({
          id: wallet.id,
          name: wallet.name,
          type: wallet.type,
        })),
        categories: categories.map((category) => ({
          id: category.id,
          slug: category.slug,
          label: labelOf(category),
          type: category.type,
        })),
        aliases: quickEntryService
          .pruneDangling(aliasRows ?? [], {
            walletIds: wallets.map((wallet) => wallet.id),
            categoryIds: categories.map((category) => category.id),
          })
          .map((alias) => ({
            phrase: alias.phrase,
            kind: alias.kind,
            targetId: alias.targetId,
          })),
        defaultWalletId: defaultWallet.walletId,
      }),
    [text, wallets, categories, aliasRows, defaultWallet.walletId, labelOf],
  );

  // What the user sees and what gets saved: the parse with their corrections
  // laid over it.
  const draft: ParsedDraft = useMemo(() => {
    const merged: ParsedDraft = {
      ...parsed,
      ...(overrides.type !== undefined ? { type: overrides.type } : {}),
      ...(overrides.amount !== undefined ? { amount: overrides.amount } : {}),
      ...(overrides.walletId !== undefined ? { walletId: overrides.walletId } : {}),
      ...(overrides.toWalletId !== undefined
        ? { toWalletId: overrides.toWalletId }
        : {}),
      ...(overrides.categoryId !== undefined
        ? { categoryId: overrides.categoryId }
        : {}),
      ...(overrides.occurredAt !== undefined
        ? { occurredAt: overrides.occurredAt }
        : {}),
    };

    // Switching away from a transfer by hand must not leave a destination
    // behind: the database rejects that shape outright.
    if (merged.type !== "transfer") {
      merged.toWalletId = null;
    } else {
      merged.categoryId = null;
    }

    // A corrected field is no longer a guess.
    const corrected = new Set<GuessedField>();
    if (overrides.type !== undefined) corrected.add("type");
    if (overrides.amount !== undefined) corrected.add("amount");
    if (overrides.walletId !== undefined) corrected.add("wallet");
    if (overrides.categoryId !== undefined) corrected.add("category");
    if (overrides.occurredAt !== undefined) corrected.add("date");
    merged.guessed = merged.guessed.filter((field) => !corrected.has(field));

    return merged;
  }, [parsed, overrides]);

  /**
   * The one phrase worth remembering from this correction, if any.
   *
   * Offered rather than applied: the checkbox is what turns a private guess
   * into a lesson, and a user who never ticks it never accumulates aliases
   * they cannot see.
   */
  const aliasProposal: AliasProposal | null = useMemo(() => {
    const changedCategory =
      overrides.categoryId !== undefined &&
      overrides.categoryId !== null &&
      overrides.categoryId !== parsed.categoryId;
    const changedWallet =
      overrides.walletId !== undefined &&
      overrides.walletId !== null &&
      overrides.walletId !== parsed.walletId;

    // One field at a time: a correction to both says nothing about which of
    // them the leftover words meant.
    if (changedCategory === changedWallet) return null;

    return proposeAlias(
      parsed.unparsedSpans,
      changedCategory
        ? { field: "category", targetId: overrides.categoryId as number }
        : { field: "wallet", targetId: overrides.walletId as number },
      { walletNames: wallets.map((wallet) => wallet.name) },
    );
  }, [overrides, parsed, wallets]);

  const aliasTargetLabel = useMemo(() => {
    if (!aliasProposal) return null;
    if (aliasProposal.kind === "wallet") {
      return wallets.find((wallet) => wallet.id === aliasProposal.targetId)?.name ?? null;
    }
    const category = categories.find((entry) => entry.id === aliasProposal.targetId);
    return category ? labelOf(category) : null;
  }, [aliasProposal, wallets, categories, labelOf]);

  const changeText = useCallback((value: string) => {
    setText(value);
    // Corrections belong to the sentence that produced them; a new sentence
    // gets a fresh parse rather than yesterday's overrides on top.
    setOverrides({});
    setShouldLearn(false);
    setError(null);
  }, []);

  const override = useCallback(<K extends keyof Overrides>(field: K, value: Overrides[K]) => {
    setOverrides((current) => ({ ...current, [field]: value }));
    setError(null);
  }, []);

  const payload = useMemo(() => toCreateTransactionInput(draft), [draft]);

  const submit = useCallback(
    async (onSaved?: () => void) => {
      if (isSubmitting) return;
      if (!payload) {
        setError(
          draft.amount === null
            ? t("quickEntry.amountMissing")
            : t("quickEntry.walletMissing"),
        );
        return;
      }

      setIsSubmitting(true);
      try {
        await transactionService.createTransaction(payload);
        // The lesson is written only after the transaction it came from was
        // actually saved, so a failed save never teaches anything.
        if (shouldLearn && aliasProposal) {
          await quickEntryService.learnAlias(aliasProposal);
        }
        setIsSubmitting(false);
        setText("");
        setOverrides({});
        setShouldLearn(false);
        onSaved?.();
      } catch (e) {
        console.error("Failed to save the quick entry", e);
        setError(t("quickEntry.failed"));
        setIsSubmitting(false);
      }
    },
    [aliasProposal, draft.amount, isSubmitting, payload, shouldLearn, t],
  );

  return {
    text,
    changeText,
    draft,
    override,
    canSave: payload !== null,
    aliasProposal,
    aliasTargetLabel,
    shouldLearn,
    setShouldLearn,
    isSubmitting,
    error,
    submit,
    isReady: walletsReady && categoriesAt !== undefined && aliasesAt !== undefined,
  };
}
