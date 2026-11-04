"use client";

import { formatAsGBP } from "@/lib/currency-format";
import { orderCategoriesByPopularity } from "@/lib/ordered-categories";
import { Transactions } from "@/lib/starling-types";
import { useSearchParams } from "next/navigation";
import {
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HiOutlineCash } from "react-icons/hi";
import FeedEntry from "./feed-entry";
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

const DRAWER_COLLAPSED_GAP = 8;

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

  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStart = useRef<{ y: number; time: number } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentTouchStart = useRef<{
    y: number;
    time: number;
    scrollTop: number;
    dragStartY: number | null;
  } | null>(null);
  const [drawerTop, setDrawerTop] = useState<number | null>(null);
  const [drawerCollapsedOffset, setDrawerCollapsedOffset] = useState(0);

  useLayoutEffect(() => {
    const updateDrawerTop = () => {
      const summary = document.getElementById("spending-summary");
      if (!summary) return;

      const bounds = summary.getBoundingClientRect();
      const top = Math.max(0, bounds.top);
      setDrawerTop(top);
      setDrawerCollapsedOffset(
        Math.max(0, bounds.bottom + DRAWER_COLLAPSED_GAP - top),
      );
    };

    updateDrawerTop();
    const summary = document.getElementById("spending-summary");
    const observer = summary ? new ResizeObserver(updateDrawerTop) : null;
    if (summary) observer?.observe(summary);
    window.addEventListener("resize", updateDrawerTop);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateDrawerTop);
    };
  }, []);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      if (!touch) return;

      contentTouchStart.current = {
        y: touch.clientY,
        time: Date.now(),
        scrollTop: scrollArea.scrollTop,
        dragStartY: null,
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      const start = contentTouchStart.current;
      if (!start) return;

      const touch = event.touches.item(0);
      if (!touch) return;

      const y = touch.clientY;
      const deltaFromStart = y - start.y;
      if (start.dragStartY === null) {
        const canStartDrag =
          scrollArea.scrollTop <= 0 &&
          (isDrawerExpanded ? deltaFromStart > 8 : deltaFromStart < -8);
        if (!canStartDrag) return;
        start.dragStartY = start.scrollTop <= 0 ? start.y : y;
      }

      event.preventDefault();
      const delta = y - start.dragStartY;
      setDragOffset(
        isDrawerExpanded
          ? Math.min(drawerCollapsedOffset, Math.max(0, delta))
          : Math.max(-drawerCollapsedOffset, Math.min(0, delta)),
      );
    };

    const onTouchEnd = (event: TouchEvent) => {
      const start = contentTouchStart.current;
      contentTouchStart.current = null;
      const touch = event.changedTouches.item(0);
      if (!start || start.dragStartY === null || !touch) return;

      const delta = touch.clientY - start.dragStartY;
      const velocity = delta / Math.max(1, Date.now() - start.time);
      setDragOffset(0);
      if (isDrawerExpanded && (delta > 48 || velocity > 0.45)) {
        setIsDrawerExpanded(false);
      } else if (!isDrawerExpanded && (delta < -48 || velocity < -0.45)) {
        setIsDrawerExpanded(true);
      }
    };

    scrollArea.addEventListener("touchstart", onTouchStart, { passive: true });
    scrollArea.addEventListener("touchmove", onTouchMove, { passive: false });
    scrollArea.addEventListener("touchend", onTouchEnd, { passive: true });
    scrollArea.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      scrollArea.removeEventListener("touchstart", onTouchStart);
      scrollArea.removeEventListener("touchmove", onTouchMove);
      scrollArea.removeEventListener("touchend", onTouchEnd);
      scrollArea.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [drawerCollapsedOffset, isDrawerExpanded]);

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

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStart.current = { y: event.clientY, time: Date.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStart.current === null) return;

    const delta = event.clientY - dragStart.current.y;
    setDragOffset(
      isDrawerExpanded
        ? Math.min(drawerCollapsedOffset, Math.max(0, delta))
        : Math.max(-drawerCollapsedOffset, Math.min(0, delta)),
    );
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStart.current === null) return;

    const { y, time } = dragStart.current;
    const delta = event.clientY - y;
    const velocity = delta / Math.max(1, Date.now() - time);
    dragStart.current = null;
    setDragOffset(0);
    if (Math.abs(delta) < 6) {
      setIsDrawerExpanded((expanded) => !expanded);
    } else if (isDrawerExpanded) {
      if (delta > 48 || velocity > 0.45) setIsDrawerExpanded(false);
    } else if (delta < -48 || velocity < -0.45) {
      setIsDrawerExpanded(true);
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        data-feed-drawer
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full flex-col rounded-t-xl border border-foreground-200 bg-background text-foreground md:hidden"
        style={{
          top:
            (drawerTop ?? 0) +
            (isDrawerExpanded ? 0 : drawerCollapsedOffset) +
            dragOffset,
          visibility: drawerTop === null ? "hidden" : "visible",
          transition: dragOffset !== 0 ? "none" : "top 300ms ease-out",
        }}
      >
        <button
          type="button"
          aria-label="Resize transaction drawer"
          aria-expanded={isDrawerExpanded}
          className="flex min-h-[44px] w-full shrink-0 touch-none flex-col items-center justify-start pt-2"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsDrawerExpanded((expanded) => !expanded);
            }
          }}
        >
          <span className="h-1.5 w-9 rounded-full bg-white shadow-sm dark:bg-white" />
        </button>
        <div
          ref={scrollAreaRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-safe"
        >
          <div className="flex flex-col gap-3 pb-4">
            {filteredItems.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-foreground-500">
                <HiOutlineCash size={64} />
                <div>Nothing to see here!</div>
              </div>
            ) : (
              Object.entries(groupedByDay).map(([title, { total, items }]) => (
                <div key={title}>
                  <div className="flex items-center justify-between px-1 py-2 text-sm text-foreground-600">
                    {title}
                    <div
                      className={
                        total < 0 ? "text-blue-600 dark:text-blue-400" : ""
                      }
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
                        settleUpOverride={settleUpOverride}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="hidden min-h-0 flex-1 flex-col gap-3 overflow-y-auto md:flex">
        {filteredItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-foreground-500">
            <HiOutlineCash size={100} />
            <div>Nothing to see here!</div>
          </div>
        ) : (
          Object.entries(groupedByDay).map(([title, { total, items }]) => (
            <div key={title}>
              <div className="flex items-center justify-between px-1 py-2 text-sm text-foreground-600">
                {title}
                <div
                  className={
                    total < 0 ? "text-blue-600 dark:text-blue-400" : ""
                  }
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
                    settleUpOverride={settleUpOverride}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
