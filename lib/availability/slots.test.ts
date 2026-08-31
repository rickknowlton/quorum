import { describe, expect, it } from "vitest";
import {
  addSlot,
  applyGridPointer,
  countDatesOutsideWeek,
  findSlotContaining,
  flattenRanges,
  formatCompactRange,
  formatWeekRangeLabel,
  hasExactSlot,
  moveSlot,
  removeSlot,
  slotsFromPointerRange,
  snapMinutes,
  timeToMinutes,
  toDateKey,
  toggleAllDay,
  weekDaysFrom,
} from "@/lib/availability/slots";

describe("time helpers", () => {
  it("converts clock times to minutes", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("12:30")).toBe(12 * 60 + 30);
    expect(timeToMinutes("18:00")).toBe(18 * 60);
    expect(timeToMinutes("not-a-time")).toBeNull();
  });

  it("snaps pointer minutes down to the grid", () => {
    expect(snapMinutes(0, 30)).toBe(0);
    expect(snapMinutes(29, 30)).toBe(0);
    expect(snapMinutes(30, 30)).toBe(30);
    expect(snapMinutes(12 * 60 + 17, 30)).toBe(12 * 60);
  });
});

describe("slotsFromPointerRange", () => {
  it("creates one duration-sized slot from a single cell click", () => {
    expect(
      slotsFromPointerRange({
        anchorMinutes: 12 * 60,
        edgeMinutes: 12 * 60,
        durationMinutes: 60,
        snap: 30,
      }),
    ).toEqual([{ start: "12:00", end: "13:00" }]);
  });

  it("fills a drag with consecutive duration-sized slots", () => {
    expect(
      slotsFromPointerRange({
        anchorMinutes: 12 * 60,
        edgeMinutes: 15 * 60 + 30,
        durationMinutes: 60,
        snap: 30,
      }),
    ).toEqual([
      { start: "12:00", end: "13:00" },
      { start: "13:00", end: "14:00" },
      { start: "14:00", end: "15:00" },
      { start: "15:00", end: "16:00" },
    ]);
  });

  it("does not create a slot that would run past midnight", () => {
    expect(
      slotsFromPointerRange({
        anchorMinutes: 23 * 60,
        edgeMinutes: 23 * 60,
        durationMinutes: 120,
        snap: 30,
      }),
    ).toEqual([]);
  });

  it("drops leftover minutes shorter than the duration when dragging", () => {
    expect(
      slotsFromPointerRange({
        anchorMinutes: 12 * 60,
        edgeMinutes: 13 * 60,
        durationMinutes: 90,
        snap: 30,
      }),
    ).toEqual([{ start: "12:00", end: "13:30" }]);
  });
});

describe("group mutations", () => {
  it("adds and groups slots by date", () => {
    const groups = addSlot(
      addSlot([], "2026-08-30", "15:00", "18:00"),
      "2026-08-30",
      "18:00",
      "21:00",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.date).toBe("2026-08-30");
    expect(groups[0]?.ranges.map((range) => `${range.start}-${range.end}`)).toEqual([
      "15:00-18:00",
      "18:00-21:00",
    ]);
  });

  it("does not add duplicate slots", () => {
    const once = addSlot([], "2026-08-26", "12:00", "13:00");
    const twice = addSlot(once, "2026-08-26", "12:00", "13:00");
    expect(twice[0]?.ranges).toHaveLength(1);
  });

  it("removes a slot and drops empty dates", () => {
    const groups = removeSlot(
      addSlot([], "2026-08-26", "12:00", "13:00"),
      "2026-08-26",
      "12:00",
      "13:00",
    );
    expect(groups).toEqual([]);
  });

  it("toggles all-day independently of timed slots", () => {
    const timed = addSlot([], "2026-08-26", "18:00", "21:00");
    const withAllDay = toggleAllDay(timed, "2026-08-26");
    expect(hasExactSlot(withAllDay, "2026-08-26", "00:00", "23:59")).toBe(true);
    expect(hasExactSlot(withAllDay, "2026-08-26", "18:00", "21:00")).toBe(true);
    expect(toggleAllDay(withAllDay, "2026-08-26")[0]?.ranges).toHaveLength(1);
  });

  it("finds the timed slot under a pointer", () => {
    const groups = addSlot([], "2026-08-26", "12:00", "15:00");
    expect(findSlotContaining(groups, "2026-08-26", 12 * 60 + 30)?.end).toBe("15:00");
    expect(findSlotContaining(groups, "2026-08-26", 15 * 60)).toBeUndefined();
  });

  it("moves a slot to a new day and keeps its duration and id", () => {
    const groups = addSlot([], "2026-08-26", "17:00", "18:00");
    const rangeId = groups[0]!.ranges[0]!.id;
    const next = moveSlot(groups, rangeId, "2026-08-27", 15 * 60, 30);

    expect(flattenRanges(next)).toEqual([
      { id: rangeId, date: "2026-08-27", start: "15:00", end: "16:00" },
    ]);
  });

  it("clamps a move that would run past midnight", () => {
    const groups = addSlot([], "2026-08-26", "12:00", "14:00");
    const rangeId = groups[0]!.ranges[0]!.id;
    const next = moveSlot(groups, rangeId, "2026-08-26", 23 * 60, 30);

    expect(flattenRanges(next)).toEqual([
      { id: rangeId, date: "2026-08-26", start: "22:00", end: "23:59" },
    ]);
  });

  it("leaves groups unchanged when the destination already has that slot", () => {
    const first = addSlot([], "2026-08-26", "12:00", "13:00");
    const groups = addSlot(first, "2026-08-27", "15:00", "16:00");
    const rangeId = groups[0]!.ranges[0]!.id;
    const next = moveSlot(groups, rangeId, "2026-08-27", 15 * 60, 30);
    expect(next).toEqual(groups);
  });
});

describe("applyGridPointer", () => {
  it("toggles a slot off when clicking inside it", () => {
    const groups = addSlot([], "2026-08-26", "12:00", "13:00");
    const next = applyGridPointer(groups, "2026-08-26", 12 * 60, 12 * 60, 60, 30);
    expect(next).toEqual([]);
  });

  it("adds dragged duration chunks", () => {
    const next = applyGridPointer([], "2026-08-27", 12 * 60, 15 * 60 + 30, 60, 30);
    expect(flattenRanges(next).map(({ date, start, end }) => ({ date, start, end }))).toEqual([
      { date: "2026-08-27", start: "12:00", end: "13:00" },
      { date: "2026-08-27", start: "13:00", end: "14:00" },
      { date: "2026-08-27", start: "14:00", end: "15:00" },
      { date: "2026-08-27", start: "15:00", end: "16:00" },
    ]);
  });
});

describe("flattenRanges", () => {
  it("skips incomplete groups", () => {
    expect(
      flattenRanges([
        { id: "1", date: "", ranges: [{ id: "a", start: "18:00", end: "21:00" }] },
        { id: "2", date: "2026-08-30", ranges: [{ id: "b", start: "18:00", end: "21:00" }] },
      ]),
    ).toEqual([{ id: "b", date: "2026-08-30", start: "18:00", end: "21:00" }]);
  });
});

describe("labels", () => {
  it("formats compact in-block time ranges", () => {
    expect(formatCompactRange("12:00", "13:00")).toBe("12-1 PM");
    expect(formatCompactRange("12:00", "13:30")).toBe("12-1:30 PM");
    expect(formatCompactRange("11:00", "13:00")).toBe("11 AM-1 PM");
    expect(formatCompactRange("00:00", "23:59")).toBe("All day");
  });

  it("formats a week spanning two months", () => {
    const days = weekDaysFrom(new Date(2026, 7, 30));
    expect(toDateKey(days[0]!)).toBe("2026-08-30");
    expect(formatWeekRangeLabel(days)).toBe("Aug 30 - Sep 5");
  });

  it("counts times that fall outside the visible week", () => {
    const week = weekDaysFrom(new Date(2026, 7, 31));
    expect(
      countDatesOutsideWeek(["2026-08-23", "2026-08-31", "2026-09-08", "2026-09-08"], week),
    ).toEqual({ earlier: 1, later: 2 });
  });
});
