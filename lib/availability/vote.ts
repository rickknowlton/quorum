export type AvailabilityVoteValue = "yes" | "maybe" | "no" | "";

export function cycleAvailabilityVote(
  current: AvailabilityVoteValue,
  allowMaybe: boolean,
): AvailabilityVoteValue {
  if (current === "yes") {
    return allowMaybe ? "maybe" : "no";
  }
  if (current === "maybe") {
    return "no";
  }
  if (current === "no") {
    return "";
  }
  return "yes";
}

export function availabilityVoteLabel(value: AvailabilityVoteValue) {
  if (value === "yes") {
    return "Yes";
  }
  if (value === "maybe") {
    return "If needed";
  }
  if (value === "no") {
    return "Can't attend";
  }
  return "No response";
}
