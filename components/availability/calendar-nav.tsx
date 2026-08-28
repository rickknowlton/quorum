"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function CalendarNav({
  view,
  rangeLabel,
  earlierCount = 0,
  laterCount = 0,
  onPrev,
  onNext,
  onToday,
}: {
  view: "week" | "month";
  rangeLabel: string;
  earlierCount?: number;
  laterCount?: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const unit = view === "week" ? "week" : "month";
  const earlierLabel = moreTimesLabel(earlierCount, "earlier");
  const laterLabel = moreTimesLabel(laterCount, "later");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{rangeLabel}</p>
        <div className="flex items-center gap-1">
          <NavButton
            ariaLabel={
              earlierCount > 0
                ? `Previous ${unit}, ${earlierCount} more ${pluralTimes(earlierCount)} earlier`
                : `Previous ${unit}`
            }
            showDot={earlierCount > 0}
            onClick={onPrev}
          >
            <ChevronLeft className="size-4" />
          </NavButton>
          <NavButton
            ariaLabel={
              laterCount > 0
                ? `Next ${unit}, ${laterCount} more ${pluralTimes(laterCount)} later`
                : `Next ${unit}`
            }
            showDot={laterCount > 0}
            onClick={onNext}
          >
            <ChevronRight className="size-4" />
          </NavButton>
          <Button variant="ghost" size="sm" onClick={onToday}>
            Today
          </Button>
        </div>
      </div>
      {earlierCount > 0 || laterCount > 0 ? (
        <p className="text-xs text-muted">
          {[earlierLabel, laterLabel].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function NavButton({
  ariaLabel,
  showDot,
  onClick,
  children,
}: {
  ariaLabel: string;
  showDot: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button variant="secondary" size="sm" aria-label={ariaLabel} onClick={onClick} className="relative">
      {children}
      {showDot ? (
        <span
          className="absolute right-1 top-1 size-1.5 rounded-full bg-accent"
          aria-hidden="true"
        />
      ) : null}
    </Button>
  );
}

export function CalendarViewTabs({
  view,
  onChange,
}: {
  view: "week" | "month";
  onChange: (view: "week" | "month") => void;
}) {
  return (
    <div className="flex gap-4" role="tablist" aria-label="Calendar view">
      <ViewTab selected={view === "week"} onClick={() => onChange("week")}>
        Week
      </ViewTab>
      <ViewTab selected={view === "month"} onClick={() => onChange("month")}>
        Month
      </ViewTab>
    </div>
  );
}

function ViewTab({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "border-b-2 px-1 pb-1 text-sm font-medium",
        selected ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function moreTimesLabel(count: number, direction: "earlier" | "later") {
  if (count <= 0) {
    return "";
  }
  return `${count} more ${pluralTimes(count)} ${direction}`;
}

function pluralTimes(count: number) {
  return count === 1 ? "time" : "times";
}
