"use server";

import { db } from "@/lib/db";

/**
 * Fetches all ignored transaction matches for a user
 * Used for the ignored matches management/history view
 */
export async function getAllIgnoredMatches(userId: string) {
  const ignoredMatches = await db.ignoredTransactionMatch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return ignoredMatches;
}
