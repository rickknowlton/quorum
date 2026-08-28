"use client";

import { useMemo, useRef, useState } from "react";
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
import { CalendarNav, CalendarViewTabs } from "@/components/availability/calendar-nav";
import { CalendarScrollArea, slotOffsetPx } from "@/components/availability/calendar-scroll";
import { cn } from "@/lib/cn";
import { timezoneLabel } from "@/lib/dates/format";
import {
  ALL_DAY_END,
  ALL_DAY_START,
  applyGridPointer,
  countDatesOutsideRange,
  countDatesOutsideWeek,
  DEFAULT_SCROLL_HOUR,
  DURATION_PRESETS,
  findSlotContaining,
  flattenRanges,
  formatCompactRange,
  formatHourLabel,
  formatWeekRangeLabel,
  GRID_HEIGHT,
  hasExactSlot,
  HOUR_HEIGHT_PX,
  HOURS,
  snapForDuration,
  snapMinutes,
  slotsFromPointerRange,
  timedRanges,
  timeToMinutes,
  toDateKey,
  toggleAllDay,
  weekDaysFrom,
  type DateGroupDraft,
} from "@/lib/availability/slots";
import { calendarGridTemplate, hourLines } from "@/components/availability/calendar-layout";
import { dayHighlight, useToday } from "@/components/availability/use-today";

type ViewMode = "week" | "month";
type DurationMode = { kind: "preset" | "custom"; minutes: number } | { kind: "all-day" };

type DragState = {
  pointerId: number;
  date: string;
  anchorMinutes: number;
  edgeMinutes: number;
  mode: "add" | "remove";
};

export function AvailabilityCalendar({
  groups,
  onChange,
  timezone,
}: {
  groups: DateGroupDraft[];
  onChange: (groups: DateGroupDraft[]) => void;
  timezone: string;
}) {
  const [view, setView] = useState<ViewMode>("week");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [duration, setDuration] = useState<DurationMode>({ kind: "preset", minutes: 60 });
  const [customMinutes, setCustomMinutes] = useState(180);
  const [customOpen, setCustomOpen] = useState(false);
  const [hover, setHover] = useState<{ date: string; minutes: number } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [focusCell, setFocusCell] = useState<{ dayIndex: number; minutes: number }>({
    dayIndex: 0,
    minutes: 9 * 60,
  });
  const dragRef = useRef<DragState | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const [gridFocused, setGridFocused] = useState(false);

  const weekDays = useMemo(() => weekDaysFrom(cursorDate), [cursorDate]);
  const snap = duration.kind === "all-day" ? 30 : snapForDuration(duration.minutes);
  const durationMinutes = duration.kind === "all-day" ? 0 : duration.minutes;
  const selectedDates = useMemo(
    () => new Set(groups.filter((group) => group.ranges.length > 0).map((group) => group.date)),
    [groups],
  );
  const selectedSlotDates = useMemo(
    () => flattenRanges(groups).map((range) => range.date),
    [groups],
  );
  const outside = useMemo(() => {
    if (view === "month") {
      return countDatesOutsideRange(
        selectedSlotDates,
        format(startOfMonth(cursorDate), "yyyy-MM-dd"),
        format(endOfMonth(cursorDate), "yyyy-MM-dd"),
      );
    }
    return countDatesOutsideWeek(selectedSlotDates, weekDays);
  }, [cursorDate, selectedSlotDates, view, weekDays]);

  function setDragState(next: DragState | null) {
    dragRef.current = next;
    setDrag(next);
  }

  function currentDuration(): DurationMode {
    if (duration.kind === "custom") {
      return { kind: "custom", minutes: clampDuration(customMinutes) };
    }
    return duration;
  }

  function applySelection(date: string, anchorMinutes: number, edgeMinutes: number) {
    const active = currentDuration();
    if (active.kind === "all-day") {
      onChange(toggleAllDay(groups, date));
      return;
    }
    onChange(
      applyGridPointer(groups, date, anchorMinutes, edgeMinutes, active.minutes, snap),
    );
  }

  function onGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const dayCount = weekDays.length;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setFocusCell((cell) => ({ ...cell, dayIndex: Math.min(dayCount - 1, cell.dayIndex + 1) }));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setFocusCell((cell) => ({ ...cell, dayIndex: Math.max(0, cell.dayIndex - 1) }));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusCell((cell) => ({
        ...cell,
        minutes: Math.min(24 * 60 - snap, cell.minutes + snap),
      }));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusCell((cell) => ({ ...cell, minutes: Math.max(0, cell.minutes - snap) }));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const day = weekDays[focusCell.dayIndex];
      if (day) {
        applySelection(toDateKey(day), focusCell.minutes, focusCell.minutes);
      }
    }
  }

  const preview = previewSlots(groups, duration, drag, hover, snap, durationMinutes);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Duration</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Slot duration">
          {DURATION_PRESETS.map((preset) => {
            const selected = duration.kind === "preset" && duration.minutes === preset.minutes;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setDuration({ kind: "preset", minutes: preset.minutes })}
                className={chipClass(selected)}
              >
                {preset.label}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={duration.kind === "all-day"}
            onClick={() => setDuration({ kind: "all-day" })}
            className={chipClass(duration.kind === "all-day")}
          >
            All day
          </button>
          {customOpen ? (
            <label className={cn(chipClass(duration.kind === "custom"), "gap-2")}>
              <span className="sr-only">Custom duration in minutes</span>
              <input
                type="number"
                min={15}
                max={480}
                step={15}
                value={customMinutes}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setCustomMinutes(value);
                  setDuration({ kind: "custom", minutes: clampDuration(value) });
                }}
                className="w-16 bg-transparent text-center outline-none"
              />
              min
            </label>
          ) : (
            <button
              type="button"
              className={chipClass(false)}
              onClick={() => {
                setCustomOpen(true);
                setDuration({ kind: "custom", minutes: clampDuration(customMinutes) });
              }}
            >
              + Custom duration
            </button>
          )}
        </div>
      </div>

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
        <WeekGrid
          days={weekDays}
          groups={groups}
          snap={snap}
          preview={preview}
          focusCell={gridFocused ? focusCell : null}
          allDayMode={duration.kind === "all-day"}
          onFocus={() => setGridFocused(true)}
          onBlur={() => setGridFocused(false)}
          onFocusCell={setFocusCell}
          onKeyDown={onGridKeyDown}
          onToggleAllDay={(date) => onChange(toggleAllDay(groups, date))}
          onHover={setHover}
          onPointerDown={(event, date, minutes) => {
            if (event.pointerType === "touch") {
              touchRef.current = { x: event.clientX, y: event.clientY };
              return;
            }
            event.currentTarget.setPointerCapture(event.pointerId);
            const existing = findSlotContaining(groups, date, minutes);
            const next = {
              pointerId: event.pointerId,
              date,
              anchorMinutes: minutes,
              edgeMinutes: minutes,
              mode: existing ? ("remove" as const) : ("add" as const),
            };
            setDragState(next);
          }}
          onPointerMove={(event, date, minutes) => {
            const active = dragRef.current;
            if (
              active &&
              active.mode === "add" &&
              event.pointerId === active.pointerId &&
              active.date === date
            ) {
              setDragState({ ...active, edgeMinutes: minutes });
            }
          }}
          onPointerCancel={() => {
            touchRef.current = null;
            setDragState(null);
          }}
          onPointerUp={(event, date, minutes) => {
            if (event.pointerType === "touch") {
              const start = touchRef.current;
              touchRef.current = null;
              if (!start) {
                return;
              }
              const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
              if (moved > 12) {
                return;
              }
              applySelection(date, minutes, minutes);
              return;
            }
            const active = dragRef.current;
            if (active && event.pointerId === active.pointerId) {
              applySelection(active.date, active.anchorMinutes, active.edgeMinutes);
            }
            setDragState(null);
          }}
        />
      )}
    </div>
  );
}

function WeekGrid({
  days,
  groups,
  snap,
  preview,
  focusCell,
  allDayMode,
  onFocus,
  onBlur,
  onFocusCell,
  onKeyDown,
  onToggleAllDay,
  onHover,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  days: Date[];
  groups: DateGroupDraft[];
  snap: number;
  preview: Array<{ date: string; start: string; end: string }>;
  focusCell: { dayIndex: number; minutes: number } | null;
  allDayMode: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onFocusCell: (cell: { dayIndex: number; minutes: number }) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onToggleAllDay: (date: string) => void;
  onHover: (hover: { date: string; minutes: number } | null) => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, date: string, minutes: number) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>, date: string, minutes: number) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>, date: string, minutes: number) => void;
  onPointerCancel: () => void;
}) {
  const today = useToday();

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
                <p className="text-[11px] font-medium uppercase tracking-wide">
                  {format(day, "EEE")}
                </p>
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
            const selected = hasExactSlot(groups, date, ALL_DAY_START, ALL_DAY_END);
            return (
              <button
                key={date}
                type="button"
                aria-pressed={selected}
                aria-label={`${selected ? "Remove" : "Add"} all-day option on ${format(day, "EEEE, MMMM d")}`}
                onClick={() => onToggleAllDay(date)}
                className={cn(
                  "min-h-12 border-r border-border px-2 py-1.5 last:border-r-0 hover:bg-stone-50",
                  dayHighlight(day, today).current && "bg-teal-50/60",
                )}
              >
                {selected ? (
                  <span className="block rounded-md bg-accent px-2 py-1 text-left text-[13px] font-medium text-white">
                    All day
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <CalendarScrollArea
          scrollTopPx={DEFAULT_SCROLL_HOUR * HOUR_HEIGHT_PX}
          slotOffsetsPx={days.flatMap((day) => {
            const group = groups.find((item) => item.date === toDateKey(day));
            const ranges = group ? timedRanges(group.ranges) : [];
            const previewForDay = preview.filter((slot) => slot.date === toDateKey(day));
            return [...ranges, ...previewForDay].flatMap((range) => {
              const minutes = timeToMinutes(range.start);
              return minutes === null ? [] : [slotOffsetPx(minutes)];
            });
          })}
          role="grid"
          aria-label="Candidate times"
          tabIndex={0}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
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
            {days.map((day, dayIndex) => {
              const date = toDateKey(day);
              const group = groups.find((item) => item.date === date);
              const ranges = group ? timedRanges(group.ranges) : [];
              const dayPreview = preview.filter((slot) => slot.date === date);
              const { past, current } = dayHighlight(day, today);

              return (
                <div
                  key={date}
                  role="presentation"
                  className={cn(
                    "relative cursor-pointer select-none border-r border-border last:border-r-0",
                    past && "bg-stone-50/80",
                    current && "bg-teal-50/40",
                  )}
                  style={{
                    backgroundImage: hourLines,
                    backgroundSize: `100% ${HOUR_HEIGHT_PX}px, 100% ${HOUR_HEIGHT_PX}px`,
                    backgroundPosition: `0 0, 0 ${HOUR_HEIGHT_PX / 2}px`,
                  }}
                  onPointerDown={(event) => {
                    const minutes = minutesFromPointer(event, snap);
                    onFocusCell({ dayIndex, minutes });
                    onPointerDown(event, date, minutes);
                  }}
                  onPointerMove={(event) => {
                    const minutes = minutesFromPointer(event, snap);
                    onHover({ date, minutes });
                    onPointerMove(event, date, minutes);
                  }}
                  onPointerUp={(event) => {
                    const minutes = minutesFromPointer(event, snap);
                    onPointerUp(event, date, minutes);
                    onHover(null);
                  }}
                  onPointerCancel={onPointerCancel}
                  onPointerLeave={() => onHover(null)}
                >
                  {ranges.map((range) => (
                    <SlotBlock key={range.id} start={range.start} end={range.end} solid />
                  ))}
                  {dayPreview.map((slot) => (
                    <SlotBlock
                      key={`preview-${slot.start}-${slot.end}`}
                      start={slot.start}
                      end={slot.end}
                      solid={false}
                    />
                  ))}
                  {focusCell && focusCell.dayIndex === dayIndex && !allDayMode ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 border-2 border-accent"
                      style={{
                        top: focusCell.minutes * (HOUR_HEIGHT_PX / 60),
                        height: snap * (HOUR_HEIGHT_PX / 60),
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </CalendarScrollArea>
      </div>
    </div>
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

function SlotBlock({
  start,
  end,
  solid,
}: {
  start: string;
  end: string;
  solid: boolean;
}) {
  const startMinutes = minutesOrZero(start);
  const endMinutes = minutesOrZero(end);
  const height = Math.max((endMinutes - startMinutes) * (HOUR_HEIGHT_PX / 60), 16);
  const label = formatCompactRange(start, end);
  const tight = height < 20;
  const compact = height < 28;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-1 z-20 flex items-center overflow-hidden rounded-md text-left font-medium",
        tight
          ? "px-1 text-[10px] leading-none"
          : compact
            ? "px-1.5 text-[11px] leading-tight"
            : "px-1.5 py-1 text-[13px] leading-tight",
        solid ? "bg-accent text-white shadow-sm" : "border border-accent/40 bg-accent/15 text-accent",
      )}
      style={{
        top: startMinutes * (HOUR_HEIGHT_PX / 60) + 1,
        height: height - 2,
      }}
      title={label}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}

function chipClass(selected: boolean) {
  return cn(
    "inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors",
    selected
      ? "border-accent bg-accent text-white"
      : "border-border bg-surface text-foreground hover:bg-stone-50",
  );
}

function clampDuration(value: number) {
  if (!Number.isFinite(value)) {
    return 60;
  }
  return Math.min(480, Math.max(15, Math.round(value / 15) * 15 || 15));
}

function minutesFromPointer(event: React.PointerEvent<HTMLDivElement>, snap: number) {
  const rect = event.currentTarget.getBoundingClientRect();
  const y = event.clientY - rect.top;
  return snapMinutes(y / (HOUR_HEIGHT_PX / 60), snap);
}

function minutesOrZero(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) {
    return 0;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function previewSlots(
  groups: DateGroupDraft[],
  duration: DurationMode,
  drag: DragState | null,
  hover: { date: string; minutes: number } | null,
  snap: number,
  durationMinutes: number,
) {
  if (duration.kind === "all-day") {
    return [];
  }
  if (drag) {
    if (drag.mode === "remove") {
      return [];
    }
    return slotsFromPointerRange({
      anchorMinutes: drag.anchorMinutes,
      edgeMinutes: drag.edgeMinutes,
      durationMinutes,
      snap,
    }).map((slot) => ({ ...slot, date: drag.date }));
  }
  if (!hover || findSlotContaining(groups, hover.date, hover.minutes)) {
    return [];
  }
  return slotsFromPointerRange({
    anchorMinutes: hover.minutes,
    edgeMinutes: hover.minutes,
    durationMinutes,
    snap,
  }).map((slot) => ({ ...slot, date: hover.date }));
}