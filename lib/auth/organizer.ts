import { matchesStoredSecret } from "@/lib/auth/tokens";

export function isPollOwner(poll: { ownerUserId: string | null }, userId: string | null | undefined) {
  return Boolean(userId && poll.ownerUserId && userId === poll.ownerUserId);
}

export function isOrganizerAuthorized(
  poll: { ownerUserId: string | null; adminToken: string },
  userId: string | null | undefined,
  presentedToken?: string,
) {
  return isPollOwner(poll, userId) || matchesStoredSecret(presentedToken, poll.adminToken);
}

export function canClaimAnonymousPoll(options: {
  ownerUserId: string | null;
  userId: string | null | undefined;
  hasValidOrganizerToken: boolean;
}) {
  return Boolean(options.userId && options.ownerUserId === null && options.hasValidOrganizerToken);
}
