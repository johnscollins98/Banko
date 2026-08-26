"use server";

import {
  matchTransactionsByRecipientAndReference,
  TransactionMatch,
} from "@/lib/actions/auto-categorize/match-transactions";
import { getStartAndEndOfMonth } from "@/lib/date-range";
import { db } from "@/lib/db";
import { getUserSettingsCached } from "@/lib/queries/user-settings";
import getUserAccount from "@/lib/user";
import { cookies } from "next/headers";

/**
 * Consolidated query that:
 * 1. Fetches current and previous month transactions from Starling API
 * 2. Calculates transaction matches
 * 3. Filters out any ignored matches from the database
 * 4. Returns ready-to-display matches
 */
export async function getAutoCategoriseMatches(
  offset: number,
): Promise<TransactionMatch[]> {
  const { user, starling, accountId, defaultCategory } = await getUserAccount();
  const userSettings = (await getUserSettingsCached(user.id)) ?? {
    monthBarrierOption: "CALENDAR",
    day: 1,
  };

  const date = new Date(Date.now());
  const timeZone = decodeURIComponent(
    (await cookies()).get("banko-timezone")?.value ?? "UTC",
  );

  // Get current and previous month date ranges
  const { start: currentStart, end: currentEnd } = getStartAndEndOfMonth(
    date,
    userSettings.monthBarrierOption,
    userSettings.day,
    offset,
    timeZone,
  );

  const { start: prevStart, end: prevEnd } = getStartAndEndOfMonth(
    date,
    userSettings.monthBarrierOption,
    userSettings.day,
    offset - 1,
    timeZone,
  );

  // Fetch transactions from both months
  const [currentTransactions, previousTransactions] = await Promise.all([
    starling.getTransactions(
      accountId,
      currentStart,
      currentEnd,
      defaultCategory,
    ),
    starling.getTransactions(accountId, prevStart, prevEnd, defaultCategory),
  ]);

  // Calculate potential matches
  const potentialMatches = matchTransactionsByRecipientAndReference(
    currentTransactions.feedItems.filter((i) => i.status !== "DECLINED"),
    previousTransactions.feedItems.filter((i) => i.status !== "DECLINED"),
  );

  // Fetch ignored matches for this user
  const ignoredMatches = await db.ignoredTransactionMatch.findMany({
    where: { userId: user.id },
    select: {
      currentTransactionId: true,
      previousTransactionId: true,
    },
  });

  // Create a set for O(1) lookup
  const ignoredSet = new Set(
    ignoredMatches.map(
      (m) => `${m.currentTransactionId}|${m.previousTransactionId}`,
    ),
  );

  // Mark ignored matches with the ignored flag
  const matchesWithIgnoreStatus = potentialMatches.map((match) => {
    const key = `${match.currentTransaction.feedItemUid}|${match.previousTransaction.feedItemUid}`;
    return {
      ...match,
      ignored: ignoredSet.has(key),
    };
  });

  return matchesWithIgnoreStatus;
}
