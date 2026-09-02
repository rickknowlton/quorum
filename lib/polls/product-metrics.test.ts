import { describe, expect, it } from "vitest";
import { ORGANIZER_LINK_SHARE_THRESHOLD, isCreatedAnonymous } from "@/lib/polls/product-metrics";

describe("created-anonymous flag", () => {
  it("is true only when there is no owner at create time", () => {
    expect(isCreatedAnonymous(null)).toBe(true);
    expect(isCreatedAnonymous(undefined)).toBe(true);
    expect(isCreatedAnonymous("user_abc")).toBe(false);
  });
});

describe("organizer-link share heuristic", () => {
  it("treats a handful of opens as the leak threshold", () => {
    expect(ORGANIZER_LINK_SHARE_THRESHOLD).toBe(5);
  });
});
