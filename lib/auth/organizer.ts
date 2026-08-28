export function isPollOwner(poll: { ownerUserId: string | null }, userId: string | null | undefined) {
  return Boolean(userId && poll.ownerUserId && userId === poll.ownerUserId);
}
