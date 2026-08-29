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
import { calendarGridTemplate, hourLines } from "@/components/availability/calendar-layout";
import { CalendarNav, CalendarViewTabs } from "@/components/availability/calendar-nav";
import { scrollTopForSlots, slotOffsetPx } from "@/components/availability/calendar-scroll";
import { dayHighlight, useToday } from "@/components/availability/use-today";
import { WeekCalendarShell } from "@/components/availability/week-calendar-shell";
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
import type { RankedAvailabilityOption } from "@/lib/availability/rank";
import { formatWallDate, formatWallTime, timezoneLabel } from "@/lib/dates/format";
import type { PollQuestion } from "@/lib/polls/queries";
import { availabilityHeatLevel } from "@/lib/results/heat";

type CalendarSlot = {
  id: string;
  date: string;
  start: string;
  end: string;
  allDay: boolean;
  label: string;
};

type ViewMode = "week" | "month";

export function AvailabilityResultsCalendar({
  question,
  ranked,
  participantCount,
  timezone,
}: {
  question: PollQuestion;
  ranked: RankedAvailabilityOption[];
  participantCount: number;
  timezone: string;
}) {
  const tallyById = useMemo(
    () => new Map(ranked.map((item) => [item.optionId, item])),
    [ranked],
  );
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
  const heatByDate = useMemo(() => {
    const best = new Map<string, number>();
    for (const slot of slots) {
      const tally = tallyById.get(slot.id);
      const level = availabilityHeatLevel(
        tally?.yesCount ?? 0,
        tally?.maybeCount ?? 0,
        participantCount,
      );
      best.set(slot.date, Math.max(best.get(slot.date) ?? 0, level));
    }
    return best;
  }, [participantCount, slots, tallyById]);

  return (
    <div className="min-w-0 space-y-4">
      <HeatLegend />

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
          heatByDate={heatByDate}
          onSelectDay={(day) => {
            setCursorDate(day);
            setView("week");
          }}
        />
      ) : (
        <ResultsWeekGrid
          days={weekDays}
          slots={weekSlots}
          tallyById={tallyById}
          participantCount={participantCount}
        />
      )}
    </div>
  );
}

function ResultsWeekGrid({
  days,
  slots,
  tallyById,
  participantCount,
}: {
  days: Date[];
  slots: CalendarSlot[];
  tallyById: Map<string, RankedAvailabilityOption>;
  participantCount: number;
}) {
  const today = useToday();
  const byDate = new Map<string, CalendarSlot[]>();
  for (const slot of slots) {
    const current = byDate.get(slot.date) ?? [];
    current.push(slot);
    byDate.set(slot.date, current);
  }

  const weekStart = days[0] ? toDateKey(days[0]) : "";

  return (
    <WeekCalendarShell
      days={days}
      scrollTopPx={scrollTopForSlots(slots.filter((slot) => !slot.allDay).map((slot) => slot.start))}
      scrollResetKey={weekStart}
      slotOffsetsPx={slots.flatMap((slot) => {
        if (slot.allDay) {
          return [];
        }
        const minutes = timeToMinutes(slot.start);
        return minutes === null ? [] : [slotOffsetPx(minutes)];
      })}
      ariaLabel="Availability results"
      allDay={
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
                  <HeatSlot
                    key={slot.id}
                    slot={slot}
                    tally={tallyById.get(slot.id)}
                    participantCount={participantCount}
                    compact
                  />
                ))}
              </div>
            );
          })}
        </div>
      }
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
                const height = Math.max((endMinutes - startMinutes) * (HOUR_HEIGHT_PX / 60), 16);
                return (
                  <div
                    key={slot.id}
                    className="absolute inset-x-1 z-20"
                    style={{
                      top: startMinutes * (HOUR_HEIGHT_PX / 60) + 1,
                      height: height - 2,
                    }}
                  >
                    <HeatSlot
                      slot={slot}
                      tally={tallyById.get(slot.id)}
                      participantCount={participantCount}
                      fill
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </WeekCalendarShell>
  );
}

function HeatSlot({
  slot,
  tally,
  participantCount,
  fill,
  compact,
}: {
  slot: CalendarSlot;
  tally?: RankedAvailabilityOption;
  participantCount: number;
  fill?: boolean;
  compact?: boolean;
}) {
  const yes = tally?.yesCount ?? 0;
  const maybe = tally?.maybeCount ?? 0;
  const no = tally?.noCount ?? 0;
  const level = availabilityHeatLevel(yes, maybe, participantCount);
  const summary = `${slot.label}: ${yes} yes, ${maybe} if needed, ${no} can’t attend`;

  return (
    <div
      role="img"
      aria-label={summary}
      title={summary}
      className={cn(
        "flex w-full items-center gap-1 overflow-hidden rounded-md px-1.5 text-left text-[13px] font-medium leading-tight",
        compact ? "min-h-8 py-1" : "h-full py-1",
        fill && "h-full",
        heatClass(level),
      )}
    >
      <span className="truncate">
        {participantCount === 0 ? slot.label : `${yes} yes · ${slot.label}`}
      </span>
    </div>
  );
}

function heatClass(level: 0 | 1 | 2 | 3 | 4) {
  if (level === 4) {
    return "bg-teal-800 text-white";
  }
  if (level === 3) {
    return "bg-accent text-white";
  }
  if (level === 2) {
    return "bg-teal-600 text-white";
  }
  if (level === 1) {
    return "bg-teal-100 text-accent";
  }
  return "border border-accent/40 bg-teal-50 text-accent";
}

function HeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>Fewer yes</span>
      <span className="flex gap-1" aria-hidden="true">
        <span className="size-4 rounded border border-accent/40 bg-teal-50" />
        <span className="size-4 rounded bg-teal-100" />
        <span className="size-4 rounded bg-teal-600" />
        <span className="size-4 rounded bg-accent" />
        <span className="size-4 rounded bg-teal-800" />
      </span>
      <span>More yes</span>
    </div>
  );
}

function MonthGrid({
  month,
  heatByDate,
  onSelectDay,
}: {
  month: Date;
  heatByDate: Map<string, number>;
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
          const level = heatByDate.get(key) ?? 0;
          const hasSlot = heatByDate.has(key);
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
              {hasSlot ? (
                <span
                  className={cn("size-1.5 rounded-full", heatDotClass(level))}
                  aria-hidden="true"
                />
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

function heatDotClass(level: number) {
  if (level >= 4) {
    return "bg-teal-800";
  }
  if (level >= 3) {
    return "bg-accent";
  }
  if (level >= 2) {
    return "bg-teal-600";
  }
  if (level >= 1) {
    return "bg-teal-300";
  }
  return "bg-teal-200";
}
