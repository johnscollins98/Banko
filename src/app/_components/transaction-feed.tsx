"use client";

import { formatAsGBP } from "@/lib/currency-format";
import { orderCategoriesByPopularity } from "@/lib/ordered-categories";
import { Transactions } from "@/lib/starling-types";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { HiOutlineCash } from "react-icons/hi";
import FeedEntry from "./feed-entry";
import { categorySchema } from "./spending-summary";

interface Props {
  feedItems: Transactions["feedItems"];
  settleUpProfile: { settleUpLink: string; status: string };
}

type FeedItemGroups = Record<
  string,
  { total: number; items: Transactions["feedItems"] }
>;

export const TransactionFeed = ({ feedItems, settleUpProfile }: Props) => {
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

  const [groupedByDay, setGroupedByDay] = useState<FeedItemGroups>({});

  const initialiseTransactions = () => {
    setGroupedByDay(
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
    );
  };

  const categories = orderCategoriesByPopularity(feedItems);

  if (filteredItems.length === 0) {
    return (
      <div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-2 text-3xl text-foreground-500">
        <div>
          <HiOutlineCash size={"100px"} />
        </div>
        <div>Nothing to see here!</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" ref={initialiseTransactions}>
      {Object.entries(groupedByDay).map(([title, { total, items }]) => (
        <div key={title}>
          <div className="flex items-center justify-between px-1 py-2 text-sm text-foreground-600">
            {title}
            <div
              className={total < 0 ? "text-blue-600 dark:text-blue-400" : ""}
            >
              {formatAsGBP(total * -1)}
            </div>
          </div>
          <div className="flex flex-1 flex-col rounded-md bg-white shadow dark:bg-foreground-100">
            {items.map((feedItem) => (
              <FeedEntry
                key={feedItem.feedItemUid}
                feedItem={feedItem}
                orderedCategories={categories}
                settleUpProfile={settleUpProfile}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
