/** Private-link opens at or above this in a short window likely means the group got the organizer URL. */
export const ORGANIZER_LINK_SHARE_THRESHOLD = 5;

export function isCreatedAnonymous(ownerUserId: string | null | undefined) {
  return ownerUserId == null;
}
