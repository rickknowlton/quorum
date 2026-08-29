"use client";

import { format } from "date-fns";
import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { CalendarScrollArea } from "@/components/availability/calendar-scroll";
import { calendarGridTemplate } from "@/components/availability/calendar-layout";
import { dayHighlight, useToday } from "@/components/availability/use-today";
import { cn } from "@/lib/cn";
import { toDateKey } from "@/lib/availability/slots";

export function WeekDayHeaders({ days }: { days: Date[] }) {
  const today = useToday();

  return (
    <div className="grid border-b border-border" style={calendarGridTemplate}>
      <div className="border-r border-border" />
      {days.map((day) => {
        const { past, current } = dayHighlight(day, today);
        return (
          <div
            key={toDateKey(day)}
            className={cn(
              "border-r border-border px-2 py-2 text-center last:border-r-0",
              past && "bg-stone-50 text-muted",
              current && "bg-teal-50 text-accent",
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide">{format(day, "EEE")}</p>
            <p className={cn("text-lg font-semibold", current && "text-accent")}>
              {format(day, "d")}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function WeekCalendarShell({
  days,
  scrollTopPx,
  scrollResetKey,
  slotOffsetsPx,
  ariaLabel,
  allDay,
  children,
  tabIndex,
  onFocus,
  onBlur,
  onKeyDown,
  className,
  ...scrollProps
}: {
  days: Date[];
  scrollTopPx?: number;
  scrollResetKey?: string;
  slotOffsetsPx: number[];
  ariaLabel: string;
  allDay: ReactNode;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const sync = () => setHeaderHeight(header.offsetHeight);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const keyboardEnabled = tabIndex !== undefined || onKeyDown || onFocus || onBlur;

  return (
    <div
      className={cn("relative min-w-0 max-w-full rounded-xl border border-border bg-white", className)}
      role="grid"
      aria-label={ariaLabel}
    >
      {keyboardEnabled ? (
        <div
          tabIndex={tabIndex ?? 0}
          className="sr-only z-50 rounded-md bg-white px-2 py-1 text-sm font-medium text-foreground shadow-sm outline-none focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:ring-2 focus:ring-accent/40"
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        >
          {ariaLabel}. Arrow keys move, Enter adds a time.
        </div>
      ) : null}
      <CalendarScrollArea
        scrollTopPx={scrollTopPx}
        scrollResetKey={scrollResetKey}
        overlayOffsetTop={headerHeight}
        slotOffsetsPx={slotOffsetsPx}
        {...scrollProps}
      >
        <div className="min-w-[46rem]">
          <div ref={headerRef} className="sticky top-0 z-40 bg-white">
            <WeekDayHeaders days={days} />
            {allDay}
          </div>
          {children}
        </div>
      </CalendarScrollArea>
    </div>
  );
}
