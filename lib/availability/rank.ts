export type AvailabilityVote = "yes" | "maybe" | "no";

export type AvailabilityTally = {
  optionId: string;
  yesCount: number;
  maybeCount: number;
  noCount: number;
};

export type RankedAvailabilityOption = AvailabilityTally & {
  score: number;
  rank: number;
  unanimous: boolean;
  allButOneCanAttend: boolean;
  highestYes: boolean;
};

export function scoreAvailability(tally: Pick<AvailabilityTally, "yesCount" | "maybeCount">) {
  return tally.yesCount * 2 + tally.maybeCount;
}

export function compareAvailabilityTallies(a: AvailabilityTally, b: AvailabilityTally) {
  if (b.yesCount !== a.yesCount) {
    return b.yesCount - a.yesCount;
  }
  if (a.noCount !== b.noCount) {
    return a.noCount - b.noCount;
  }
  if (b.maybeCount !== a.maybeCount) {
    return b.maybeCount - a.maybeCount;
  }
  return scoreAvailability(b) - scoreAvailability(a);
}

export function rankAvailabilityOptions(
  tallies: AvailabilityTally[],
  participantCount: number,
): RankedAvailabilityOption[] {
  const maxYes = tallies.reduce((max, tally) => Math.max(max, tally.yesCount), 0);

  return [...tallies]
    .sort(compareAvailabilityTallies)
    .map((tally, index) => {
      const canAttend = tally.yesCount + tally.maybeCount;
      return {
        ...tally,
        score: scoreAvailability(tally),
        rank: index + 1,
        unanimous: participantCount > 0 && tally.yesCount === participantCount,
        allButOneCanAttend:
          participantCount >= 2 && canAttend === participantCount - 1,
        highestYes: maxYes > 0 && tally.yesCount === maxYes,
      };
    });
}

export function tallyAvailabilityVotes(
  optionIds: string[],
  votes: Array<{ optionId: string; value: string }>,
): AvailabilityTally[] {
  const counts = new Map<string, AvailabilityTally>(
    optionIds.map((optionId) => [
      optionId,
      { optionId, yesCount: 0, maybeCount: 0, noCount: 0 },
    ]),
  );

  for (const vote of votes) {
    const tally = counts.get(vote.optionId);
    if (!tally) {
      continue;
    }
    if (vote.value === "yes") {
      tally.yesCount += 1;
    } else if (vote.value === "maybe") {
      tally.maybeCount += 1;
    } else if (vote.value === "no") {
      tally.noCount += 1;
    }
  }

  return optionIds.map((optionId) => counts.get(optionId)!);
}
