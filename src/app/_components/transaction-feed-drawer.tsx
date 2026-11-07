"use client";

import { Spinner } from "@heroui/react";
import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface Props {
  children: ReactNode;
}

const SUMMARY_ID = "spending-summary";
const COLLAPSED_GAP = 8;
const LOADING_HEIGHT = 144;
const SNAP_DISTANCE = 48;
const SNAP_VELOCITY = 0.45;
const TAP_SLOP = 6;
const TOUCH_SLOP = 8;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

// Expanded: can only drag down. Collapsed: can only drag up.
const clampDrag = (delta: number, expanded: boolean, max: number) =>
  expanded ? clamp(delta, 0, max) : clamp(delta, -max, 0);

const shouldToggle = (delta: number, velocity: number, expanded: boolean) =>
  expanded
    ? delta > SNAP_DISTANCE || velocity > SNAP_VELOCITY
    : delta < -SNAP_DISTANCE || velocity < -SNAP_VELOCITY;

const getVelocity = (delta: number, startTime: number) =>
  delta / Math.max(1, Date.now() - startTime);

// Tracks summary element position. Waits for it if it streams in via Suspense.
function useSummaryGeometry(summaryId: string) {
  const [geometry, setGeometry] = useState<{
    top: number;
    collapsedOffset: number;
  } | null>(null);

  useLayoutEffect(() => {
    let summary: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | undefined;
    let mutationObserver: MutationObserver | undefined;

    const update = () => {
      if (!summary) return;
      const bounds = summary.getBoundingClientRect();
      const top = Math.max(0, bounds.top);
      setGeometry({
        top,
        collapsedOffset: Math.max(0, bounds.bottom + COLLAPSED_GAP - top),
      });
    };

    const attach = () => {
      summary = document.getElementById(summaryId);
      if (!summary) return false;
      resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(summary);
      resizeObserver.observe(document.body); // catches shifts from content above
      update();
      return true;
    };

    if (!attach()) {
      mutationObserver = new MutationObserver(() => {
        if (attach()) mutationObserver?.disconnect();
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    window.addEventListener("resize", update);
    return () => {
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [summaryId]);

  return geometry;
}

export default function TransactionFeedDrawer({ children }: Props) {
  const geometry = useSummaryGeometry(SUMMARY_ID);
  const isLoading = geometry === null;
  const top = geometry?.top ?? 0;
  const collapsedOffset = geometry?.collapsedOffset ?? 0;

  const [isExpanded, setIsExpanded] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleDrag = useRef<{ y: number; time: number } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Drag from scroll area (only when scrolled to top)
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    let start: {
      y: number;
      time: number;
      scrollTop: number;
      dragStartY: number | null;
    } | null = null;

    const onStart = (e: TouchEvent) => {
      const t = e.touches.item(0);
      if (!t) return;
      start = {
        y: t.clientY,
        time: Date.now(),
        scrollTop: el.scrollTop,
        dragStartY: null,
      };
    };

    const onMove = (e: TouchEvent) => {
      const t = e.touches.item(0);
      if (!start || !t) return;

      if (start.dragStartY === null) {
        const delta = t.clientY - start.y;
        const canDrag =
          el.scrollTop <= 0 &&
          (isExpanded ? delta > TOUCH_SLOP : delta < -TOUCH_SLOP);
        if (!canDrag) return;
        start.dragStartY = start.scrollTop <= 0 ? start.y : t.clientY;
      }

      e.preventDefault();
      setDragOffset(
        clampDrag(t.clientY - start.dragStartY, isExpanded, collapsedOffset),
      );
    };

    const onEnd = (e: TouchEvent) => {
      const s = start;
      start = null;
      const t = e.changedTouches.item(0);
      if (!s || s.dragStartY === null || !t) return;

      const delta = t.clientY - s.dragStartY;
      setDragOffset(0);
      if (shouldToggle(delta, getVelocity(delta, s.time), isExpanded))
        setIsExpanded(!isExpanded);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false }); // needs preventDefault
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [collapsedOffset, isExpanded]);

  // Drag / tap on handle
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (isLoading) return;
    handleDrag.current = { y: e.clientY, time: Date.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!handleDrag.current) return;
    setDragOffset(
      clampDrag(e.clientY - handleDrag.current.y, isExpanded, collapsedOffset),
    );
  };

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const start = handleDrag.current;
    if (!start) return;
    handleDrag.current = null;
    setDragOffset(0);

    const delta = e.clientY - start.y;
    if (Math.abs(delta) < TAP_SLOP) setIsExpanded(!isExpanded);
    else if (shouldToggle(delta, getVelocity(delta, start.time), isExpanded))
      setIsExpanded(!isExpanded);
  };

  const topPx = isLoading
    ? `calc(100dvh - ${LOADING_HEIGHT}px)`
    : top + (isExpanded ? 0 : collapsedOffset) + dragOffset;

  return (
    <div
      data-feed-drawer
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full flex-col rounded-t-xl border border-foreground-200 bg-foreground-100 text-foreground dark:bg-background md:hidden"
      style={{
        top: topPx,
        transition: dragOffset !== 0 ? "none" : "top 300ms ease-out",
      }}
    >
      <button
        type="button"
        aria-label="Resize transaction drawer"
        aria-expanded={isExpanded}
        disabled={isLoading}
        className="flex min-h-[44px] w-full shrink-0 touch-none flex-col items-center justify-start pt-2"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <span className="h-1.5 w-9 rounded-full bg-foreground-300 dark:bg-white" />
      </button>

      <div
        ref={scrollAreaRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(3rem+max(0.75rem,env(safe-area-inset-bottom)))]"
      >
        {isLoading ? (
          <div className="flex h-full min-h-12 items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
