export const calendarGridTemplate = {
  gridTemplateColumns: "4.25rem repeat(7, minmax(4.75rem, 1fr))",
} as const;

export const hourLines = `linear-gradient(to bottom, var(--border) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--border) 65%, transparent) 1px, transparent 1px)`;
