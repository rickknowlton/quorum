import { addDays, format, startOfWeek } from "date-fns";

export type TimeRangeDraft = {
  id: string;
  start: string;
  end: string;
};

export type DateGroupDraft = {
  id: string;
  date: string;
  ranges: TimeRangeDraft[];
};

export function createTimeRange(start = "18:00", end = "21:00"): TimeRangeDraft {
  return {
    id: crypto.randomUUID(),
    start,
    end,
  };
}

export function createDateGroup(date = ""): DateGroupDraft {
  return {
    id: crypto.randomUUID(),
    date,
    ranges: [createTimeRange()],
  };
}

export function flattenRanges(groups: DateGroupDraft[]) {
  return groups.flatMap((group) =>
    group.ranges
      .filter((range) => group.date && range.start && range.end)
      .map((range) => ({
        id: range.id,
        date: group.date,
        start: range.start,
        end: range.end,
      })),
  );
}

export const MINUTES_IN_DAY = 24 * 60;
export const DEFAULT_SNAP_MINUTES = 30;
export const ALL_DAY_START = "00:00";
export const ALL_DAY_END = "23:59";
export const HOUR_HEIGHT_PX = 56;
export const GRID_HEIGHT = 24 * HOUR_HEIGHT_PX;
export const DEFAULT_SCROLL_HOUR = 8;
export const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export const DURATION_PRESETS = [
  { id: "15", minutes: 15, label: "15 min" },
  { id: "30", minutes: 30, label: "30 min" },
  { id: "60", minutes: 60, label: "60 min" },
  { id: "90", minutes: 90, label: "90 min" },
  { id: "120", minutes: 120, label: "120 min" },
] as const;

export function timeToMinutes(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToTime(totalMinutes: number) {
  const clamped = Math.max(0, Math.min(MINUTES_IN_DAY - 1, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isAllDayRange(start: string, end: string) {
  return start === ALL_DAY_START && end === ALL_DAY_END;
}

export function snapMinutes(value: number, snap = DEFAULT_SNAP_MINUTES) {
  const maxStart = MINUTES_IN_DAY - snap;
  const snapped = Math.floor(value / snap) * snap;
  return Math.max(0, Math.min(maxStart, snapped));
}

export function snapForDuration(durationMinutes: number) {
  return durationMinutes % DEFAULT_SNAP_MINUTES === 0 ? DEFAULT_SNAP_MINUTES : 15;
}

export function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error("Invalid date");
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function weekDaysFrom(anchor: Date, weekStartsOn: 0 | 1 = 0) {
  const start = startOfWeek(anchor, { weekStartsOn });
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function formatWeekRangeLabel(days: Date[]) {
  const start = days[0];
  const end = days[6];
  if (!start || !end) {
    return "";
  }
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "MMMM d")} – ${format(end, "d")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

export function formatHourLabel(hour: number) {
  if (hour === 0) {
    return "12:00 AM";
  }
  if (hour === 12) {
    return "12:00 PM";
  }
  if (hour < 12) {
    return `${hour}:00 AM`;
  }
  return `${hour - 12}:00 PM`;
}

export function countDatesOutsideRange(dates: string[], startKey: string, endKey: string) {
  let earlier = 0;
  let later = 0;
  for (const date of dates) {
    if (date >= startKey && date <= endKey) {
      continue;
    }
    if (date < startKey) {
      earlier += 1;
    } else {
      later += 1;
    }
  }
  return { earlier, later };
}

export function countDatesOutsideWeek(dates: string[], weekDays: Date[]) {
  const start = weekDays[0];
  const end = weekDays[6];
  if (!start || !end) {
    return { earlier: 0, later: 0 };
  }
  return countDatesOutsideRange(dates, toDateKey(start), toDateKey(end));
}

function clockParts(time: string) {
  const total = timeToMinutes(time);
  if (total === null) {
    return null;
  }
  const hours24 = Math.floor(total / 60);
  const minutes = total % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return { hours12, minutes, meridiem };
}

export function formatCompactRange(start: string, end: string) {
  if (isAllDayRange(start, end)) {
    return "All day";
  }

  const startParts = clockParts(start);
  const endParts = clockParts(end);
  if (!startParts || !endParts) {
    return `${start}–${end}`;
  }

  const startLabel =
    startParts.minutes === 0 ? String(startParts.hours12) : `${startParts.hours12}:${pad(startParts.minutes)}`;
  const endLabel =
    endParts.minutes === 0 ? String(endParts.hours12) : `${endParts.hours12}:${pad(endParts.minutes)}`;

  if (startParts.meridiem === endParts.meridiem) {
    return `${startLabel}–${endLabel} ${endParts.meridiem}`;
  }

  return `${startLabel} ${startParts.meridiem}–${endLabel} ${endParts.meridiem}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function slotsFromPointerRange({
  anchorMinutes,
  edgeMinutes,
  durationMinutes,
  snap,
}: {
  anchorMinutes: number;
  edgeMinutes: number;
  durationMinutes: number;
  snap: number;
}) {
  const lo = Math.min(anchorMinutes, edgeMinutes);
  const hi = Math.max(anchorMinutes, edgeMinutes);
  const exclusiveEnd = hi + snap;
  const slots: Array<{ start: string; end: string }> = [];

  if (exclusiveEnd - lo <= snap) {
    const end = lo + durationMinutes;
    if (end > MINUTES_IN_DAY) {
      return slots;
    }
    if (end === MINUTES_IN_DAY) {
      slots.push({ start: minutesToTime(lo), end: ALL_DAY_END });
      return slots;
    }
    slots.push({ start: minutesToTime(lo), end: minutesToTime(end) });
    return slots;
  }

  for (
    let start = lo;
    start + durationMinutes <= exclusiveEnd && start + durationMinutes <= MINUTES_IN_DAY;
    start += durationMinutes
  ) {
    const end = start + durationMinutes;
    slots.push({
      start: minutesToTime(start),
      end: end === MINUTES_IN_DAY ? ALL_DAY_END : minutesToTime(end),
    });
  }

  return slots;
}

export function findSlotContaining(groups: DateGroupDraft[], date: string, minutes: number) {
  const group = groups.find((item) => item.date === date);
  if (!group) {
    return undefined;
  }

  return group.ranges.find((range) => {
    if (isAllDayRange(range.start, range.end)) {
      return false;
    }
    const start = timeToMinutes(range.start);
    const end = timeToMinutes(range.end);
    if (start === null || end === null) {
      return false;
    }
    return minutes >= start && minutes < end;
  });
}

export function hasExactSlot(groups: DateGroupDraft[], date: string, start: string, end: string) {
  return groups.some(
    (group) =>
      group.date === date && group.ranges.some((range) => range.start === start && range.end === end),
  );
}

export function sortGroups(groups: DateGroupDraft[]) {
  const byDate = new Map<string, DateGroupDraft>();

  for (const group of groups) {
    if (!group.date) {
      continue;
    }

    const current = byDate.get(group.date);
    if (!current) {
      byDate.set(group.date, { ...group, ranges: [...group.ranges] });
      continue;
    }

    for (const range of group.ranges) {
      const duplicate = current.ranges.some(
        (item) => item.start === range.start && item.end === range.end,
      );
      if (!duplicate) {
        current.ranges.push(range);
      }
    }
  }

  return [...byDate.values()]
    .map((group) => ({
      ...group,
      ranges: [...group.ranges].sort((a, b) => {
        const startA = timeToMinutes(a.start) ?? 0;
        const startB = timeToMinutes(b.start) ?? 0;
        return startA - startB;
      }),
    }))
    .filter((group) => group.ranges.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function addSlot(groups: DateGroupDraft[], date: string, start: string, end: string) {
  if (!date || hasExactSlot(groups, date, start, end)) {
    return sortGroups(groups);
  }

  const existing = groups.find((group) => group.date === date);
  if (!existing) {
    return sortGroups([
      ...groups,
      {
        id: crypto.randomUUID(),
        date,
        ranges: [createTimeRange(start, end)],
      },
    ]);
  }

  return sortGroups(
    groups.map((group) =>
      group.date === date
        ? { ...group, ranges: [...group.ranges, { ...createTimeRange(), start, end }] }
        : group,
    ),
  );
}

export function removeSlot(groups: DateGroupDraft[], date: string, start: string, end: string) {
  return sortGroups(
    groups.map((group) =>
      group.date === date
        ? {
            ...group,
            ranges: group.ranges.filter((range) => range.start !== start || range.end !== end),
          }
        : group,
    ),
  );
}

export function toggleAllDay(groups: DateGroupDraft[], date: string) {
  if (hasExactSlot(groups, date, ALL_DAY_START, ALL_DAY_END)) {
    return removeSlot(groups, date, ALL_DAY_START, ALL_DAY_END);
  }
  return addSlot(groups, date, ALL_DAY_START, ALL_DAY_END);
}

export function relocatedRange(
  range: TimeRangeDraft,
  toDate: string,
  startMinutes: number,
  snap: number,
) {
  if (isAllDayRange(range.start, range.end)) {
    return null;
  }

  const start = timeToMinutes(range.start);
  const end = timeToMinutes(range.end);
  if (start === null || end === null) {
    return null;
  }

  const duration = Math.max(snap, end - start);
  let nextStart = snapMinutes(startMinutes, snap);
  if (nextStart + duration > MINUTES_IN_DAY) {
    nextStart = snapMinutes(MINUTES_IN_DAY - duration, snap);
  }
  const nextEndMinutes = nextStart + duration;
  return {
    date: toDate,
    start: minutesToTime(nextStart),
    end: nextEndMinutes >= MINUTES_IN_DAY ? ALL_DAY_END : minutesToTime(nextEndMinutes),
  };
}

export function moveSlot(
  groups: DateGroupDraft[],
  rangeId: string,
  toDate: string,
  startMinutes: number,
  snap: number,
) {
  let found: TimeRangeDraft | undefined;
  for (const group of groups) {
    const range = group.ranges.find((item) => item.id === rangeId);
    if (range) {
      found = range;
      break;
    }
  }

  if (!found) {
    return groups;
  }

  const next = relocatedRange(found, toDate, startMinutes, snap);
  if (!next) {
    return groups;
  }

  const stripped = groups
    .map((group) => ({
      ...group,
      ranges: group.ranges.filter((range) => range.id !== rangeId),
    }))
    .filter((group) => group.ranges.length > 0);

  if (hasExactSlot(stripped, next.date, next.start, next.end)) {
    return groups;
  }

  const moved = { ...found, start: next.start, end: next.end };
  const existing = stripped.find((group) => group.date === toDate);
  if (!existing) {
    return sortGroups([
      ...stripped,
      { id: crypto.randomUUID(), date: toDate, ranges: [moved] },
    ]);
  }

  return sortGroups(
    stripped.map((group) =>
      group.date === toDate ? { ...group, ranges: [...group.ranges, moved] } : group,
    ),
  );
}

export function applyGridPointer(
  groups: DateGroupDraft[],
  date: string,
  anchorMinutes: number,
  edgeMinutes: number,
  durationMinutes: number,
  snap: number,
) {
  const isClick = Math.abs(edgeMinutes - anchorMinutes) < snap;
  const existing = findSlotContaining(groups, date, anchorMinutes);

  if (existing && isClick) {
    return removeSlot(groups, date, existing.start, existing.end);
  }

  const slots = slotsFromPointerRange({
    anchorMinutes,
    edgeMinutes,
    durationMinutes,
    snap,
  });

  return slots.reduce(
    (next, slot) => addSlot(next, date, slot.start, slot.end),
    groups,
  );
}

export function timedRanges(ranges: TimeRangeDraft[]) {
  return ranges.filter((range) => !isAllDayRange(range.start, range.end));
}
