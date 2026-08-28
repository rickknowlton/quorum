import type { PollStatus } from "@/db/schema";

export type PollAcceptanceState = {
  status: PollStatus;
  deadlineAt: Date | null;
};

export type PollAcceptanceResult =
  | { ok: true }
  | { ok: false; reason: "closed" | "deadline" };

export function isAcceptingResponses(
  poll: PollAcceptanceState,
  now: Date = new Date(),
): PollAcceptanceResult {
  if (poll.status === "closed") {
    return { ok: false, reason: "closed" };
  }

  if (poll.deadlineAt && poll.deadlineAt.getTime() <= now.getTime()) {
    return { ok: false, reason: "deadline" };
  }

  return { ok: true };
}

export function pollAcceptanceMessage(reason: "closed" | "deadline") {
  if (reason === "closed") {
    return "This poll is closed and is no longer accepting responses.";
  }
  return "The response deadline has passed.";
}
