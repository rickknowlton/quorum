import { describe, expect, it } from "vitest";
import { canClaimAnonymousPoll, isOrganizerAuthorized, isPollOwner } from "@/lib/auth/organizer";
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

describe("anonymous poll claiming", () => {
  it("allows a signed-in organizer who still has the private link", () => {
    expect(
      canClaimAnonymousPoll({
        ownerUserId: null,
        userId: "user_abc",
        hasValidOrganizerToken: true,
      }),
    ).toBe(true);
  });

  it("rejects claim without a valid organizer token or if the poll is already owned", () => {
    expect(
      canClaimAnonymousPoll({
        ownerUserId: null,
        userId: "user_abc",
        hasValidOrganizerToken: false,
      }),
    ).toBe(false);
    expect(
      canClaimAnonymousPoll({
        ownerUserId: "user_other",
        userId: "user_abc",
        hasValidOrganizerToken: true,
      }),
    ).toBe(false);
    expect(
      canClaimAnonymousPoll({
        ownerUserId: null,
        userId: undefined,
        hasValidOrganizerToken: true,
      }),
    ).toBe(false);
  });
});
