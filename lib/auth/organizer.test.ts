import { describe, expect, it } from "vitest";
import { isOrganizerAuthorized, isPollOwner } from "@/lib/auth/organizer";
import { hashSecret } from "@/lib/auth/tokens";

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

describe("organizer access", () => {
  const pollA = {
    ownerUserId: "user_a",
    adminToken: hashSecret("token-a"),
  };
  const pollB = {
    ownerUserId: "user_b",
    adminToken: hashSecret("token-b"),
  };

  it("lets the owner through without a token", () => {
    expect(isOrganizerAuthorized(pollA, "user_a")).toBe(true);
  });

  it("rejects an organizer from another account", () => {
    expect(isOrganizerAuthorized(pollA, "user_b")).toBe(false);
    expect(isOrganizerAuthorized(pollB, "user_a")).toBe(false);
  });

  it("rejects an admin token from another poll", () => {
    expect(isOrganizerAuthorized(pollA, undefined, "token-b")).toBe(false);
    expect(isOrganizerAuthorized(pollA, undefined, "token-a")).toBe(true);
  });
});
