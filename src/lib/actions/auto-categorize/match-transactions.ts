import { SpendingCategory, Transactions } from "@/lib/starling-types";

export interface TransactionMatch {
  currentTransaction: Transactions["feedItems"][0];
  previousTransaction: Transactions["feedItems"][0];
  categoryFromPrevious: SpendingCategory;
}

/**
 * Matches transactions from current month to previous month
 * by comparing recipient, reference, and amount.
 * A match requires all 3 of these criteria to be true:
 * - recipient name matches
 * - reference matches
 * - amount is within 5% OR ±£5 (500 minor units) of the other transaction
 * Returns only matches where categories differ
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

    // Find the closest matching previous transaction
    let bestMatch: (typeof previousTransactions)[0] | undefined;
    let bestAmountDifference = Infinity;

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
        amountDifference < bestAmountDifference
      ) {
        bestMatch = prev;
        bestAmountDifference = amountDifference;
      }
    }

    if (bestMatch && bestMatch.spendingCategory !== current.spendingCategory) {
      matches.push({
        currentTransaction: current,
        previousTransaction: bestMatch,
        categoryFromPrevious: bestMatch.spendingCategory,
      });
    }
  }

  return matches;
}
