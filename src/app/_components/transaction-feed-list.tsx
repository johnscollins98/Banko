"use client";

import { formatAsGBP } from "@/lib/currency-format";
import { Transactions } from "@/lib/starling-types";
import { HiOutlineCash } from "react-icons/hi";
import FeedEntry from "./feed-entry";

type FeedItemGroups = Record<
  string,
  { total: number; items: Transactions["feedItems"] }
>;

interface Props {
  feedItems: Transactions["feedItems"];
  groupedByDay: FeedItemGroups;
  categories: Parameters<typeof FeedEntry>[0]["orderedCategories"];
  settleUpProfile: { settleUpLink: string; status: string };
  settleUpOverride: string | null;
  emptyIconSize: number;
  emptyStateClassName?: string;
  className?: string;
}

export default function TransactionFeedList({
  feedItems,
  groupedByDay,
  categories,
  settleUpProfile,
  settleUpOverride,
  emptyIconSize,
  emptyStateClassName = "min-h-48",
  className,
}: Props) {
  return (
    <div className={className}>
      {feedItems.length === 0 ? (
        <div
          className={`flex flex-col items-center justify-center gap-2 text-foreground-500 ${emptyStateClassName}`}
        >
          <HiOutlineCash size={emptyIconSize} />
          <div>Nothing to see here!</div>
        </div>
      ) : (
        Object.entries(groupedByDay).map(([title, { total, items }]) => (
          <div key={title}>
            <div className="flex items-center justify-between px-1 py-2 text-sm text-foreground-600">
              {title}
              <div className={total < 0 ? "text-blue-600 dark:text-blue-400" : ""}>
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
                  settleUpOverride={settleUpOverride}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
