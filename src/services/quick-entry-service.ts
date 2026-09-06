import {
  quickEntryAliasInsertSchema,
  quickEntryAliasRepository,
  type QuickEntryAlias,
} from "@/db";

import type { AliasProposal } from "./quick-entry-alias.ts";

export const quickEntryService = {
  /**
   * Remembers a phrase the user corrected.
   *
   * Only ever called after an explicit yes: a silent bind cannot be undone by
   * someone who does not know the feature exists, and a wrong alias misfiles
   * transactions without announcing itself.
   */
  async learnAlias(proposal: AliasProposal): Promise<void> {
    const payload = quickEntryAliasInsertSchema.parse({
      phrase: proposal.phrase,
      kind: proposal.kind,
      targetId: proposal.targetId,
    });
    await quickEntryAliasRepository.upsert(payload);
  },

  async forgetAlias(phrase: string): Promise<void> {
    await quickEntryAliasRepository.removeByPhrase(phrase.trim().toLowerCase());
  },

  /**
   * Drops aliases whose target no longer exists.
   *
   * `targetId` cannot be a foreign key — it points at either a wallet or a
   * category — so a deleted wallet leaves a row that resolves to nothing. The
   * parser skips those, and this is what stops them accumulating.
   */
  pruneDangling(
    aliases: QuickEntryAlias[],
    live: { walletIds: number[]; categoryIds: number[] },
  ): QuickEntryAlias[] {
    const wallets = new Set(live.walletIds);
    const categories = new Set(live.categoryIds);

    return aliases.filter((alias) =>
      alias.kind === "wallet"
        ? wallets.has(alias.targetId)
        : categories.has(alias.targetId),
    );
  },
};
