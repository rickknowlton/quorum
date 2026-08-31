"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, Trash2 } from "lucide-react";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label } from "@/components/ui/fields";
import {
  flattenRanges,
  formatCompactRange,
  isAllDayRange,
  parseDateKey,
  removeSlot,
  sortGroups,
  type DateGroupDraft,
  type TimeRangeDraft,
} from "@/lib/availability/slots";

export type { DateGroupDraft, TimeRangeDraft };

export {
  flattenRanges,
  createDateGroup,
  createTimeRange,
} from "@/lib/availability/slots";

export function AvailabilityBuilder({
  groups,
  onChange,
  timezone,
}: {
  groups: DateGroupDraft[];
  onChange: (groups: DateGroupDraft[]) => void;
  timezone: string;
}) {
  const selectedCount = flattenRanges(groups).length;
  const [detailsOpen, setDetailsOpen] = useState(false);

  function updateGroup(id: string, patch: Partial<DateGroupDraft>) {
    onChange(
      sortGroups(groups.map((group) => (group.id === id ? { ...group, ...patch } : group))),
    );
  }

  function updateRange(groupId: string, rangeId: string, patch: Partial<TimeRangeDraft>) {
    onChange(
      sortGroups(
        groups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                ranges: group.ranges.map((range) =>
                  range.id === rangeId ? { ...range, ...patch } : range,
                ),
              }
            : group,
        ),
      ),
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Click a time to add it. Drag to add several in a row. Hold a block, then drag to move it.
        Tap a block to remove it. Each block is a separate option people can vote on.
      </p>

      <AvailabilityCalendar groups={groups} onChange={onChange} timezone={timezone} />

      {selectedCount === 0 ? (
        <Hint>No times selected yet.</Hint>
      ) : (
        <details
          className="group rounded-lg border border-border bg-stone-50/80"
          onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            <span>
              {selectedCount} {selectedCount === 1 ? "time" : "times"} selected
              <span className="ml-2 font-normal text-muted">Edit times</span>
            </span>
            <ChevronDown
              className="size-4 shrink-0 text-muted transition group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          {detailsOpen ? (
          <ul className="space-y-4 border-t border-border p-4">
            {groups.map((group) => (
              <li key={group.id} className="rounded-lg border border-border bg-stone-50/80 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-52 flex-1">
                    <Label htmlFor={`date-${group.id}`}>{formatGroupHeading(group.date)}</Label>
                    <Input
                      id={`date-${group.id}`}
                      type="date"
                      value={group.date}
                      onChange={(event) => updateGroup(group.id, { date: event.target.value })}
                    />
                  </div>
                </div>
                <ul className="mt-4 space-y-3">
                  {group.ranges.map((range) => (
                    <li
                      key={range.id}
                      className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end"
                    >
                      {isAllDayRange(range.start, range.end) ? (
                        <p className="text-sm font-medium">All day</p>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <Label htmlFor={`start-${range.id}`}>Start</Label>
                            <Input
                              id={`start-${range.id}`}
                              type="time"
                              value={range.start}
                              onChange={(event) =>
                                updateRange(group.id, range.id, { start: event.target.value })
                              }
                            />
                          </div>
                          <span className="hidden text-muted sm:mb-3 sm:inline" aria-hidden="true">
                            -
                          </span>
                          <div className="min-w-0">
                            <Label htmlFor={`end-${range.id}`}>End</Label>
                            <Input
                              id={`end-${range.id}`}
                              type="time"
                              value={range.end}
                              onChange={(event) =>
                                updateRange(group.id, range.id, { end: event.target.value })
                              }
                            />
                          </div>
                          <p className="text-sm text-muted sm:mb-3">
                            {formatCompactRange(range.start, range.end)}
                          </p>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center sm:w-auto"
                        aria-label={`Remove ${formatCompactRange(range.start, range.end)}`}
                        onClick={() =>
                          onChange(removeSlot(groups, group.date, range.start, range.end))
                        }
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          ) : null}
        </details>
      )}
    </div>
  );
}

function formatGroupHeading(date: string) {
  try {
    return format(parseDateKey(date), "EEEE, MMMM d");
  } catch {
    return "Date";
  }
}
