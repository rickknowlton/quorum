"use client";

import { track } from "@vercel/analytics";

export const productEvent = {
  pollCreatedAnonymous: "poll_created_anonymous",
  copiedOrganizerLink: "copied_organizer_link",
  pollClaimed: "poll_claimed",
  organizerLinkOpened: "organizer_link_opened",
} as const;

export type ProductEvent = (typeof productEvent)[keyof typeof productEvent];

/** Pulse events only. Never attach URLs, poll ids, or secrets. */
export function trackProduct(event: ProductEvent) {
  track(event);
}
