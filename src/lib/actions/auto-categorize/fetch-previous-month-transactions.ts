"use server";

import { getStartAndEndOfMonth } from "@/lib/date-range";
import { getUserSettingsCached } from "@/lib/queries/user-settings";
import { Transactions } from "@/lib/starling-types";
import getUserAccount from "@/lib/user";

/**
 * Fetches transactions from the previous month
 * Uses user's month barrier settings to determine month boundaries
 */
export default async function fetchTransactionsForMonth(
  offset: number,
): Promise<Transactions> {
  const { user, starling, accountId, defaultCategory } = await getUserAccount();
  const userSettings = (await getUserSettingsCached(user.id)) ?? {
    monthBarrierOption: "CALENDAR",
    day: 1,
  };

  const date = new Date(Date.now());
  date.setHours(0, 0, 0, 0);

  // Get previous month's date range (offset -1)
  const { start, end } = getStartAndEndOfMonth(
    date,
    userSettings.monthBarrierOption,
    userSettings.day,
    offset,
  );

  return await starling.getTransactions(accountId, start, end, defaultCategory);
}
