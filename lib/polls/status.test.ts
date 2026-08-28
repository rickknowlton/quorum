import { describe, expect, it } from "vitest";
import { isAcceptingResponses, pollAcceptanceMessage } from "@/lib/polls/status";

describe("poll deadline and closed handling", () => {
  const now = new Date("2026-08-26T15:00:00.000Z");

  it("accepts open polls without a deadline", () => {
    expect(isAcceptingResponses({ status: "open", deadlineAt: null }, now)).toEqual({
      ok: true,
    });
  });

  it("rejects closed polls even if the deadline is in the future", () => {
    expect(
      isAcceptingResponses(
        { status: "closed", deadlineAt: new Date("2026-09-01T00:00:00.000Z") },
        now,
      ),
    ).toEqual({ ok: false, reason: "closed" });
    expect(pollAcceptanceMessage("closed")).toMatch(/closed/i);
  });

  it("rejects open polls after the deadline", () => {
    expect(
      isAcceptingResponses(
        { status: "open", deadlineAt: new Date("2026-08-26T14:59:59.000Z") },
        now,
      ),
    ).toEqual({ ok: false, reason: "deadline" });
    expect(pollAcceptanceMessage("deadline")).toMatch(/deadline/i);
  });

  it("still accepts responses exactly before the deadline", () => {
    expect(
      isAcceptingResponses(
        { status: "open", deadlineAt: new Date("2026-08-26T15:00:01.000Z") },
        now,
      ),
    ).toEqual({ ok: true });
  });
});
