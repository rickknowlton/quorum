import { describe, expect, it } from "vitest";
import { cycleAvailabilityVote } from "@/lib/availability/vote";

describe("cycleAvailabilityVote", () => {
  it("cycles yes → maybe → no → clear when maybe is allowed", () => {
    expect(cycleAvailabilityVote("", true)).toBe("yes");
    expect(cycleAvailabilityVote("yes", true)).toBe("maybe");
    expect(cycleAvailabilityVote("maybe", true)).toBe("no");
    expect(cycleAvailabilityVote("no", true)).toBe("");
  });

  it("skips maybe when it is disabled", () => {
    expect(cycleAvailabilityVote("", false)).toBe("yes");
    expect(cycleAvailabilityVote("yes", false)).toBe("no");
    expect(cycleAvailabilityVote("no", false)).toBe("");
  });
});
