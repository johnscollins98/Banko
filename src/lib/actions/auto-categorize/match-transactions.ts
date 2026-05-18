import { SpendingCategory, Transactions } from "@/lib/starling-types";

export interface TransactionMatch {
  currentTransaction: Transactions["feedItems"][0];
  previousTransaction: Transactions["feedItems"][0];
  categoryFromPrevious: SpendingCategory;
  ignored: boolean;
}

/**
 * Matches transactions from current month to previous month
 * by comparing recipient, reference, and amount.
 * A match requires all 3 of these criteria to be true:
 * - recipient name matches
 * - reference matches
 * - amount is within 5% OR ±£5 (500 minor units) of the other transaction
 * Returns all matches where categories differ (not just the best match)
 */
export function matchTransactionsByRecipientAndReference(
  currentTransactions: Transactions["feedItems"],
  previousTransactions: Transactions["feedItems"],
): TransactionMatch[] {
  const matches: TransactionMatch[] = [];

  for (const current of currentTransactions) {
    const currentRecipient = current.counterPartyName?.toLowerCase();
    const currentReference = current.reference?.toLowerCase();
    const currentAmount = current.amount.minorUnits;

    for (const prev of previousTransactions) {
      if (
        prev.counterPartyName?.toLowerCase() !== currentRecipient ||
        prev.reference?.toLowerCase() !== currentReference
      ) {
        continue;
      }

      const amountDifference = Math.abs(prev.amount.minorUnits - currentAmount);
      const percentageTolerance =
        Math.max(Math.abs(prev.amount.minorUnits), Math.abs(currentAmount)) *
        0.1; // 10% tolerance
      const fixedTolerance = 500; // £5
      const amountTolerance = Math.max(percentageTolerance, fixedTolerance);

      if (
        amountDifference <= amountTolerance &&
        prev.spendingCategory !== current.spendingCategory
      ) {
        matches.push({
          currentTransaction: current,
          previousTransaction: prev,
          categoryFromPrevious: prev.spendingCategory,
          ignored: false,
        });
      }
    }
  }

  return matches;
}
