import { SpendingCategory, Transactions } from "@/lib/starling-types";

export interface TransactionMatch {
  currentTransaction: Transactions["feedItems"][0];
  previousTransaction: Transactions["feedItems"][0];
  categoryFromPrevious: SpendingCategory;
}

/**
 * Matches transactions from current month to previous month
 * by comparing recipient, reference, and/or amount.
 * A match requires at least 2 of these 3 criteria to be true:
 * - recipient name matches
 * - reference matches
 * - amount matches
 * Returns only matches where categories differ
 */
export function matchTransactionsByRecipientAndReference(
  currentTransactions: Transactions["feedItems"],
  previousTransactions: Transactions["feedItems"],
): TransactionMatch[] {
  const matches: TransactionMatch[] = [];

  for (const current of currentTransactions) {
    // Look for a previous transaction matching at least 2 of: recipient, reference, amount
    const previous = previousTransactions.find((prev) => {
      const recipientMatches =
        prev.counterPartyName?.toLowerCase() ===
        current.counterPartyName?.toLowerCase();
      const referenceMatches =
        prev.reference?.toLowerCase() === current.reference?.toLowerCase();
      const amountMatches =
        prev.amount.minorUnits === current.amount.minorUnits;

      // Count how many criteria match
      const matchCount = [
        recipientMatches,
        referenceMatches,
        amountMatches,
      ].filter(Boolean).length;

      return matchCount >= 2;
    });

    if (previous && previous.spendingCategory !== current.spendingCategory) {
      matches.push({
        currentTransaction: current,
        previousTransaction: previous,
        categoryFromPrevious: previous.spendingCategory,
      });
    }
  }

  return matches;
}
