"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Check, ChevronDown, Minus, X } from "lucide-react";
import { calendarGridTemplate, hourLines } from "@/components/availability/calendar-layout";
import { CalendarNav, CalendarViewTabs } from "@/components/availability/calendar-nav";
import { CalendarScrollArea, scrollTopForSlots, slotOffsetPx } from "@/components/availability/calendar-scroll";
import { dayHighlight, useToday } from "@/components/availability/use-today";
import { cn } from "@/lib/cn";
import {
  formatCompactRange,
  formatHourLabel,
  formatWeekRangeLabel,
  GRID_HEIGHT,
  HOUR_HEIGHT_PX,
  HOURS,
  isAllDayRange,
  parseDateKey,
  timeToMinutes,
  toDateKey,
  weekDaysFrom,
  countDatesOutsideRange,
  countDatesOutsideWeek,
} from "@/lib/availability/slots";
import {
  availabilityVoteLabel,
  cycleAvailabilityVote,
  type AvailabilityVoteValue,
} from "@/lib/availability/vote";
import { formatWallDate, formatWallTime, timezoneLabel } from "@/lib/dates/format";
import type { PollQuestion } from "@/lib/polls/queries";

type CalendarSlot = {
  id: string;
  date: string;
  start: string;
  end: string;
  allDay: boolean;
  label: string;
};

type ViewMode = "week" | "month";

export function AvailabilityRespondCalendar({
  question,
  timezone,
  allowMaybe,
  selections,
  onChange,
}: {
  question: PollQuestion;
  timezone: string;
  allowMaybe: boolean;
  selections: Record<string, AvailabilityVoteValue>;
  onChange: (optionId: string, value: AvailabilityVoteValue) => void;
}) {
  const slots = useMemo(
    () =>
      question.options.flatMap((option) => {
        if (!option.startsAt || !option.endsAt) {
          return [];
        }
        const date = formatWallDate(option.startsAt, timezone);
        const start = formatWallTime(option.startsAt, timezone);
        const end = formatWallTime(option.endsAt, timezone);
        return [
          {
            id: option.id,
            date,
            start,
            end,
            allDay: isAllDayRange(start, end),
            label: formatCompactRange(start, end),
          } satisfies CalendarSlot,
        ];
      }),
    [question.options, timezone],
  );

  const selectedDates = useMemo(() => new Set(slots.map((slot) => slot.date)), [slots]);
  const firstDate = slots[0]?.date;

  const [view, setView] = useState<ViewMode>("week");
  const [cursorDate, setCursorDate] = useState(() =>
    firstDate ? parseDateKey(firstDate) : new Date(),
  );
  const weekDays = useMemo(() => weekDaysFrom(cursorDate), [cursorDate]);
  const weekKeys = useMemo(() => new Set(weekDays.map((day) => toDateKey(day))), [weekDays]);
  const weekSlots = useMemo(
    () => slots.filter((slot) => weekKeys.has(slot.date)),
    [slots, weekKeys],
  );
  const answered = slots.filter((slot) => {
    const value = selections[slot.id];
    return value === "yes" || value === "maybe" || value === "no";
  }).length;
  const slotDates = useMemo(() => slots.map((slot) => slot.date), [slots]);
  const outside = useMemo(() => {
    if (view === "month") {
      return countDatesOutsideRange(
        slotDates,
        format(startOfMonth(cursorDate), "yyyy-MM-dd"),
        format(endOfMonth(cursorDate), "yyyy-MM-dd"),
      );
    }
    return countDatesOutsideWeek(slotDates, weekDays);
  }, [cursorDate, slotDates, view, weekDays]);

  function cycle(optionId: string) {
    onChange(optionId, cycleAvailabilityVote(selections[optionId] ?? "", allowMaybe));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Mark the times that work. One is enough — you can leave the rest blank. Click again to cycle
        {allowMaybe ? " Yes → If needed → Can’t attend → clear." : " Yes → Can’t attend → clear."}
      </p>
      <VoteLegend allowMaybe={allowMaybe} />
      <p className="text-sm text-muted">
        {answered} of {slots.length} {slots.length === 1 ? "time" : "times"} marked
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <CalendarViewTabs view={view} onChange={setView} />
        <p className="text-sm text-muted">{timezoneLabel(timezone)}</p>
      </div>

      <CalendarNav
        view={view}
        rangeLabel={view === "week" ? formatWeekRangeLabel(weekDays) : format(cursorDate, "MMMM yyyy")}
        earlierCount={outside.earlier}
        laterCount={outside.later}
        onPrev={() =>
          setCursorDate((current) => (view === "week" ? addWeeks(current, -1) : addMonths(current, -1)))
        }
        onNext={() =>
          setCursorDate((current) => (view === "week" ? addWeeks(current, 1) : addMonths(current, 1)))
        }
        onToday={() => setCursorDate(new Date())}
      />

      {view === "month" ? (
        <MonthGrid
          month={cursorDate}
          selectedDates={selectedDates}
          onSelectDay={(day) => {
            setCursorDate(day);
            setView("week");
          }}
        />
      ) : (
        <RespondWeekGrid
          days={weekDays}
          slots={weekSlots}
          selections={selections}
          onCycle={cycle}
        />
      )}
    </div>
  );
}

function RespondWeekGrid({
  days,
  slots,
  selections,
  onCycle,
}: {
  days: Date[];
  slots: CalendarSlot[];
  selections: Record<string, AvailabilityVoteValue>;
  onCycle: (optionId: string) => void;
}) {
  const today = useToday();
  const byDate = new Map<string, CalendarSlot[]>();
  for (const slot of slots) {
    const current = byDate.get(slot.date) ?? [];
    current.push(slot);
    byDate.set(slot.date, current);
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-border bg-white">
      <div className="min-w-[46rem]">
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

        <div className="grid border-b border-border" style={calendarGridTemplate}>
          <div className="flex items-center justify-end border-r border-border px-2 py-2 text-xs text-muted">
            All day
          </div>
          {days.map((day) => {
            const date = toDateKey(day);
            const allDay = (byDate.get(date) ?? []).filter((slot) => slot.allDay);
            const { current } = dayHighlight(day, today);
            return (
              <div
                key={date}
                className={cn(
                  "min-h-12 space-y-1 border-r border-border px-1 py-1 last:border-r-0",
                  current && "bg-teal-50/60",
                )}
              >
                {allDay.map((slot) => (
                  <VoteSlot
                    key={slot.id}
                    slot={slot}
                    value={selections[slot.id] ?? ""}
                    onCycle={() => onCycle(slot.id)}
                    compact
                  />
                ))}
              </div>
            );
          })}
        </div>

        <CalendarScrollArea
          scrollTopPx={scrollTopForSlots(
            slots.filter((slot) => !slot.allDay).map((slot) => slot.start),
          )}
          slotOffsetsPx={slots.flatMap((slot) => {
            if (slot.allDay) {
              return [];
            }
            const minutes = timeToMinutes(slot.start);
            return minutes === null ? [] : [slotOffsetPx(minutes)];
          })}
          role="grid"
          aria-label="Availability times"
        >
          <div className="grid" style={{ ...calendarGridTemplate, height: GRID_HEIGHT }}>
            <div className="relative border-r border-border">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 text-[11px] text-muted"
                  style={{ top: hour * HOUR_HEIGHT_PX - (hour === 0 ? 0 : 8) }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>
            {days.map((day) => {
              const date = toDateKey(day);
              const timed = (byDate.get(date) ?? []).filter((slot) => !slot.allDay);
              const { past, current } = dayHighlight(day, today);
              return (
                <div
                  key={date}
                  className={cn(
                    "relative border-r border-border last:border-r-0",
                    past && "bg-stone-50/80",
                    current && "bg-teal-50/40",
                  )}
                  style={{
                    backgroundImage: hourLines,
                    backgroundSize: `100% ${HOUR_HEIGHT_PX}px, 100% ${HOUR_HEIGHT_PX}px`,
                    backgroundPosition: `0 0, 0 ${HOUR_HEIGHT_PX / 2}px`,
                  }}
                >
                  {timed.map((slot) => {
                    const startMinutes = timeToMinutes(slot.start) ?? 0;
                    const endMinutes = timeToMinutes(slot.end) ?? 0;
                    const height = Math.max(
                      (endMinutes - startMinutes) * (HOUR_HEIGHT_PX / 60),
                      16,
                    );
                    return (
                      <div
                        key={slot.id}
                        className="absolute inset-x-1 z-20"
                        style={{
                          top: startMinutes * (HOUR_HEIGHT_PX / 60) + 1,
                          height: height - 2,
                        }}
                      >
                        <VoteSlot
                          slot={slot}
                          value={selections[slot.id] ?? ""}
                          onCycle={() => onCycle(slot.id)}
                          fill
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </CalendarScrollArea>
      </div>
    </div>
  );
}

function VoteSlot({
  slot,
  value,
  onCycle,
  fill,
  compact,
}: {
  slot: CalendarSlot;
  value: AvailabilityVoteValue;
  onCycle: () => void;
  fill?: boolean;
  compact?: boolean;
}) {
  const label = availabilityVoteLabel(value);
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`${slot.label}: ${label}. Activate to change.`}
      className={cn(
        "flex w-full items-center gap-1 overflow-hidden rounded-md px-1.5 text-left text-[13px] font-medium leading-tight transition-colors",
        compact ? "min-h-8 py-1" : "h-full py-1",
        fill && "h-full",
        value === "" && "border border-accent/40 bg-teal-50 text-accent hover:bg-teal-100",
        value === "yes" && "bg-accent text-white hover:bg-accent-hover",
        value === "maybe" && "bg-amber-500 text-white hover:bg-amber-600",
        value === "no" && "bg-stone-200 text-no hover:bg-stone-300",
      )}
    >
      <VoteIcon value={value} />
      <span className="truncate">{slot.label}</span>
    </button>
  );
}

function VoteIcon({ value }: { value: AvailabilityVoteValue }) {
  if (value === "yes") {
    return <Check className="size-3.5 shrink-0" aria-hidden="true" />;
  }
  if (value === "maybe") {
    return <Minus className="size-3.5 shrink-0" aria-hidden="true" />;
  }
  if (value === "no") {
    return <X className="size-3.5 shrink-0" aria-hidden="true" />;
  }
  return null;
}

function VoteLegend({ allowMaybe }: { allowMaybe: boolean }) {
  return (
    <ul className="flex flex-wrap gap-3 text-xs text-muted">
      <li className="inline-flex items-center gap-1.5">
        <span className="inline-flex size-5 items-center justify-center rounded bg-accent text-white">
          <Check className="size-3" aria-hidden="true" />
        </span>
        Yes
      </li>
      {allowMaybe ? (
        <li className="inline-flex items-center gap-1.5">
          <span className="inline-flex size-5 items-center justify-center rounded bg-amber-500 text-white">
            <Minus className="size-3" aria-hidden="true" />
          </span>
          If needed
        </li>
      ) : null}
      <li className="inline-flex items-center gap-1.5">
        <span className="inline-flex size-5 items-center justify-center rounded bg-stone-200 text-no">
          <X className="size-3" aria-hidden="true" />
        </span>
        Can&apos;t attend
      </li>
    </ul>
  );
}

function MonthGrid({
  month,
  selectedDates,
  onSelectDay,
}: {
  month: Date;
  selectedDates: Set<string>;
  onSelectDay: (day: Date) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 0 }),
  });
  const today = useToday();

  return (
    <div className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-border bg-white">
      <div className="grid grid-cols-7 border-b border-border text-center text-[11px] font-medium uppercase tracking-wide text-muted">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label} className="px-2 py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = toDateKey(day);
          const inMonth = isSameMonth(day, month);
          const { past, current } = dayHighlight(day, today);
          const selected = selectedDates.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-label={`Show week of ${format(day, "EEEE, MMMM d")}`}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 border-b border-r border-border px-2 py-2 text-sm last:border-r-0",
                !inMonth && "text-stone-300",
                inMonth && past && "text-muted",
                current && "bg-teal-50 font-semibold text-accent",
              )}
            >
              {format(day, "d")}
              {selected ? (
                <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              ) : (
                <span className="size-1.5" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AvailabilityListToggle({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <details
      className="group rounded-lg border border-border bg-stone-50/80"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        <span>
          View as a list · {count} {count === 1 ? "time" : "times"}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted transition group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      {open ? <div className="border-t border-border p-4">{children}</div> : null}
    </details>
  );
}
