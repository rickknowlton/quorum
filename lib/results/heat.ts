export function availabilityHeatLevel(
  yesCount: number,
  maybeCount: number,
  participantCount: number,
): 0 | 1 | 2 | 3 | 4 {
  if (participantCount <= 0) {
    return 0;
  }

  const ratio = (yesCount * 2 + maybeCount) / (participantCount * 2);
  if (ratio >= 0.8) {
    return 4;
  }
  if (ratio >= 0.55) {
    return 3;
  }
  if (ratio >= 0.3) {
    return 2;
  }
  if (yesCount + maybeCount > 0) {
    return 1;
  }
  return 0;
}
