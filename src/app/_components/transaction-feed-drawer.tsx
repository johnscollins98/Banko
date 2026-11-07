"use client";

import { Spinner } from "@heroui/react";
import { type PointerEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
}

const DRAWER_COLLAPSED_GAP = 8;
const DRAWER_LOADING_HEIGHT = 144;

export default function TransactionFeedDrawer({
  children,
}: Props) {
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [isDrawerLoading, setIsDrawerLoading] = useState(true);
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
      setDrawerCollapsedOffset(Math.max(0, bounds.bottom + DRAWER_COLLAPSED_GAP - top));
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
    if (drawerTop === null || !isDrawerLoading) return;
    const timeout = window.setTimeout(() => setIsDrawerLoading(false), 450);
    return () => window.clearTimeout(timeout);
  }, [drawerTop, isDrawerLoading]);

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
      const deltaFromStart = touch.clientY - start.y;
      if (start.dragStartY === null) {
        const canStartDrag = scrollArea.scrollTop <= 0 &&
          (isDrawerExpanded ? deltaFromStart > 8 : deltaFromStart < -8);
        if (!canStartDrag) return;
        start.dragStartY = start.scrollTop <= 0 ? start.y : touch.clientY;
      }
      event.preventDefault();
      const delta = touch.clientY - start.dragStartY;
      setDragOffset(isDrawerExpanded
        ? Math.min(drawerCollapsedOffset, Math.max(0, delta))
        : Math.max(-drawerCollapsedOffset, Math.min(0, delta)));
    };
    const onTouchEnd = (event: TouchEvent) => {
      const start = contentTouchStart.current;
      contentTouchStart.current = null;
      const touch = event.changedTouches.item(0);
      if (!start || start.dragStartY === null || !touch) return;
      const delta = touch.clientY - start.dragStartY;
      const velocity = delta / Math.max(1, Date.now() - start.time);
      setDragOffset(0);
      if (isDrawerExpanded && (delta > 48 || velocity > 0.45)) setIsDrawerExpanded(false);
      else if (!isDrawerExpanded && (delta < -48 || velocity < -0.45)) setIsDrawerExpanded(true);
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

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStart.current = { y: event.clientY, time: Date.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStart.current === null) return;
    const delta = event.clientY - dragStart.current.y;
    setDragOffset(isDrawerExpanded
      ? Math.min(drawerCollapsedOffset, Math.max(0, delta))
      : Math.max(-drawerCollapsedOffset, Math.min(0, delta)));
  };
  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStart.current === null) return;
    const { y, time } = dragStart.current;
    const delta = event.clientY - y;
    const velocity = delta / Math.max(1, Date.now() - time);
    dragStart.current = null;
    setDragOffset(0);
    if (Math.abs(delta) < 6) setIsDrawerExpanded((expanded) => !expanded);
    else if (isDrawerExpanded) {
      if (delta > 48 || velocity > 0.45) setIsDrawerExpanded(false);
    } else if (delta < -48 || velocity < -0.45) setIsDrawerExpanded(true);
  };

  return (
    <div
      data-feed-drawer
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full flex-col rounded-t-xl border border-foreground-200 bg-foreground-100 text-foreground dark:bg-background md:hidden"
      style={{
        top: isDrawerLoading
          ? `calc(100dvh - ${DRAWER_LOADING_HEIGHT}px)`
          : (drawerTop ?? 0) + (isDrawerExpanded ? 0 : drawerCollapsedOffset) + dragOffset,
        bottom: 0,
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
        <span className="h-1.5 w-9 rounded-full bg-foreground-300 dark:bg-white" />
      </button>
      <div
        ref={scrollAreaRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4"
        style={{ paddingBottom: "calc(3rem + max(0.75rem, env(safe-area-inset-bottom)))" }}
      >
        {isDrawerLoading ? (
          <div className="flex h-full min-h-12 items-center justify-center"><Spinner size="sm" /></div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
