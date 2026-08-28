import { describe, expect, it } from "vitest";
import { isPollOwner } from "@/lib/auth/organizer";

describe("poll owner authorization", () => {
  it("accepts the signed-in owner", () => {
    expect(isPollOwner({ ownerUserId: "user_abc" }, "user_abc")).toBe(true);
  });

  it("rejects missing owner, missing user, and mismatches", () => {
    expect(isPollOwner({ ownerUserId: null }, "user_abc")).toBe(false);
    expect(isPollOwner({ ownerUserId: "user_abc" }, undefined)).toBe(false);
    expect(isPollOwner({ ownerUserId: "user_abc" }, "user_other")).toBe(false);
  });
});
