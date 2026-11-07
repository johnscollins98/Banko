"use client";

import { orderCategoriesByPopularity } from "@/lib/ordered-categories";
import { Transactions } from "@/lib/starling-types";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import TransactionFeedDrawer from "./transaction-feed-drawer";
import TransactionFeedList from "./transaction-feed-list";
import { categorySchema } from "./spending-summary";

interface Props {
  feedItems: Transactions["feedItems"];
  settleUpProfile: { settleUpLink: string; status: string };
  settleUpOverride: string | null;
}

type FeedItemGroups = Record<
  string,
  { total: number; items: Transactions["feedItems"] }
>;

export const TransactionFeed = ({
  feedItems,
  settleUpProfile,
  settleUpOverride,
}: Props) => {
  const searchParams = useSearchParams();
  const category =
    categorySchema.safeParse(searchParams.get("filterBy")).data ?? null;

  const filteredItems = useMemo(
    () =>
      category
        ? feedItems.filter((i) => i.spendingCategory === category)
        : feedItems,
    [feedItems, category],
  );

  const groupedByDay = useMemo(
    () =>
      filteredItems.reduce((groups, item) => {
        const date = new Date(item.transactionTime);
        const day = date.toLocaleDateString(undefined, { dateStyle: "long" });

        const itemsForDay = groups[day] ?? { total: 0, items: [] };

        const toAdd =
          item.direction === "IN"
            ? (item.amount.minorUnits / 100) * -1
            : item.amount.minorUnits / 100;
        const total = itemsForDay.total + toAdd;
        const items = [...itemsForDay.items, item];

        return { ...groups, [day]: { ...itemsForDay, total, items } };
      }, {} as FeedItemGroups),
    [filteredItems],
  );

  const categories = orderCategoriesByPopularity(feedItems);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <TransactionFeedDrawer>
        <TransactionFeedList
          feedItems={filteredItems}
          groupedByDay={groupedByDay}
          categories={categories}
          settleUpProfile={settleUpProfile}
          settleUpOverride={settleUpOverride}
          emptyIconSize={64}
          className="flex flex-col gap-3 pb-4"
        />
      </TransactionFeedDrawer>
      <div className="hidden min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:flex">
        <TransactionFeedList
          feedItems={filteredItems}
          groupedByDay={groupedByDay}
          categories={categories}
          settleUpProfile={settleUpProfile}
          settleUpOverride={settleUpOverride}
          emptyIconSize={100}
          emptyStateClassName="flex-1"
          className="flex flex-1 flex-col gap-3"
        />
      </div>
    </div>
  );
};
