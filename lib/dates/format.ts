import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

export function wallTimeToUtc(date: string, time: string, timezone: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time);

  if (!dateMatch || !timeMatch) {
    throw new Error("Invalid date or time");
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  const tzDate = new TZDate(year, month - 1, day, hours, minutes, 0, 0, timezone);
  return new Date(tzDate.getTime());
}

export function toZonedDate(utcDate: Date | string, timezone: string) {
  const date = utcDate instanceof Date ? utcDate : new Date(utcDate);
  return TZDate.tz(timezone, date);
}

export function formatDateHeading(utcDate: Date | string, timezone: string) {
  return format(toZonedDate(utcDate, timezone), "EEEE, MMMM d");
}

export function formatShortDate(utcDate: Date | string, timezone: string) {
  return format(toZonedDate(utcDate, timezone), "EEE MMM d");
}

export function formatTime(utcDate: Date | string, timezone: string) {
  return format(toZonedDate(utcDate, timezone), "h:mm a");
}

export function formatTimeRange(
  startsAt: Date | string,
  endsAt: Date | string,
  timezone: string,
) {
  const start = toZonedDate(startsAt, timezone);
  const end = toZonedDate(endsAt, timezone);
  const startLabel = format(start, "h:mm a");
  const endLabel = format(end, "h:mm a");

  const startMeridiem = format(start, "a");
  const endMeridiem = format(end, "a");

  if (startMeridiem === endMeridiem) {
    return `${format(start, "h:mm")}-${endLabel}`;
  }

  return `${startLabel}-${endLabel}`;
}

export function formatOptionLabel(
  startsAt: Date | string,
  endsAt: Date | string,
  timezone: string,
) {
  return `${formatShortDate(startsAt, timezone)}, ${formatTimeRange(startsAt, endsAt, timezone)}`;
}

export function formatFinalDate(
  startsAt: Date | string,
  endsAt: Date | string,
  timezone: string,
) {
  return {
    date: format(toZonedDate(startsAt, timezone), "EEEE, MMMM d"),
    time: formatTimeRange(startsAt, endsAt, timezone),
  };
}

export function formatDateTimeLocal(utcDate: Date | string, timezone: string) {
  return format(toZonedDate(utcDate, timezone), "yyyy-MM-dd'T'HH:mm");
}

export function formatWallDate(utcDate: Date | string, timezone: string) {
  return format(toZonedDate(utcDate, timezone), "yyyy-MM-dd");
}

export function formatWallTime(utcDate: Date | string, timezone: string) {
  return format(toZonedDate(utcDate, timezone), "HH:mm");
}

export function timezoneLabel(timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    const name = parts.find((part) => part.type === "timeZoneName")?.value;
    return name ? `${timezone} (${name})` : timezone;
  } catch {
    return timezone;
  }
}

export function isValidTimeRange(start: string, end: string) {
  const startMatch = /^(\d{1,2}):(\d{2})$/.exec(start);
  const endMatch = /^(\d{1,2}):(\d{2})$/.exec(end);
  if (!startMatch || !endMatch) {
    return false;
  }

  const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
  const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);
  return endMinutes > startMinutes;
}
