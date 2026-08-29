"use client";

import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { DEFAULT_SCROLL_HOUR, HOUR_HEIGHT_PX, timeToMinutes } from "@/lib/availability/slots";
import { cn } from "@/lib/cn";

export function slotOffsetPx(startMinutes: number) {
  return startMinutes * (HOUR_HEIGHT_PX / 60);
}

export function scrollTopForSlots(startTimes: string[]) {
  const minutes = startTimes
    .map((time) => timeToMinutes(time))
    .filter((value): value is number => value !== null);
  const hour = minutes.length
    ? Math.max(0, Math.floor(Math.min(...minutes) / 60) - 1)
    : DEFAULT_SCROLL_HOUR;
  return hour * HOUR_HEIGHT_PX;
}

const scrollMemory = new Map<string, number>();

export function CalendarScrollArea({
  slotOffsetsPx,
  scrollTopPx,
  scrollResetKey,
  overlayOffsetTop = 0,
  className,
  children,
  ...props
}: {
  slotOffsetsPx: number[];
  scrollTopPx?: number;
  scrollResetKey?: string;
  overlayOffsetTop?: number;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ above: false, below: false });
  const offsetsKey = slotOffsetsPx.join(",");

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const memoryKey = scrollResetKey ?? "__init__";
    const remembered = scrollMemory.get(memoryKey);
    if (remembered !== undefined) {
      scroller.scrollTop = remembered;
    } else if (scrollTopPx !== undefined) {
      scroller.scrollTop = scrollTopPx;
    }
    scrollMemory.set(memoryKey, scroller.scrollTop);

    const offsets = offsetsKey
      ? offsetsKey.split(",").map((value) => Number(value))
      : [];

    function sync(el: HTMLDivElement) {
      const top = el.scrollTop;
      const bottom = top + el.clientHeight;
      let above = false;
      let below = false;
      for (const offset of offsets) {
        if (offset + 12 < top) {
          above = true;
        }
        if (offset + overlayOffsetTop > bottom - 12) {
          below = true;
        }
      }
      setEdges((current) =>
        current.above === above && current.below === below ? current : { above, below },
      );
    }

    sync(scroller);
    const onScroll = () => {
      scrollMemory.set(memoryKey, scroller.scrollTop);
      sync(scroller);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(() => sync(scroller));
    observer.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [offsetsKey, overlayOffsetTop, scrollResetKey, scrollTopPx]);

  return (
    <div className="relative">
      {edges.above ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-30 flex h-10 items-start justify-center bg-gradient-to-b from-white to-transparent pt-1"
          style={{ top: overlayOffsetTop }}
        >
          <span className="rounded-full bg-stone-800/80 px-2 py-0.5 text-[11px] font-medium text-white">
            More times above
          </span>
        </div>
      ) : null}
      <div
        {...props}
        ref={scrollerRef}
        className={cn(
          "max-h-[36rem] overflow-auto overscroll-contain [overflow-anchor:none]",
          className,
        )}
      >
        {children}
      </div>
      {edges.below ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex h-10 items-end justify-center bg-gradient-to-t from-white to-transparent pb-1">
          <span className="rounded-full bg-stone-800/80 px-2 py-0.5 text-[11px] font-medium text-white">
            More times below
          </span>
        </div>
      ) : null}
    </div>
  );
}
