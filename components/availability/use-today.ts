"use client";

import { useSyncExternalStore } from "react";
import { isBefore, isToday, startOfDay } from "date-fns";

function subscribe() {
  return () => {};
}

export function useToday() {
  const time = useSyncExternalStore<number | null>(
    subscribe,
    () => startOfDay(new Date()).getTime(),
    () => null,
  );
  return time == null ? null : new Date(time);
}

export function dayHighlight(day: Date, today: Date | null) {
  if (!today) {
    return { past: false, current: false };
  }
  return {
    past: isBefore(startOfDay(day), today),
    current: isToday(day),
  };
}
