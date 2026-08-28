import { describe, expect, it } from "vitest";
import { compareAvailabilityTallies, rankAvailabilityOptions } from "@/lib/availability/rank";

describe("rankAvailabilityOptions", () => {
  it("ranks by most yes, then fewest no, then maybe, then score", () => {
    const ranked = rankAvailabilityOptions(
      [
        { optionId: "a", yesCount: 8, maybeCount: 0, noCount: 2 },
        { optionId: "b", yesCount: 10, maybeCount: 0, noCount: 0 },
        { optionId: "c", yesCount: 9, maybeCount: 1, noCount: 0 },
        { optionId: "d", yesCount: 9, maybeCount: 0, noCount: 1 },
      ],
      10,
    );

    expect(ranked.map((item) => item.optionId)).toEqual(["b", "c", "d", "a"]);
    expect(ranked[0]?.score).toBe(20);
  });

  it("prefers fewer no votes when yes counts match", () => {
    const result = compareAvailabilityTallies(
      { optionId: "busy", yesCount: 6, maybeCount: 1, noCount: 3 },
      { optionId: "open", yesCount: 6, maybeCount: 0, noCount: 1 },
    );
    expect(result).toBeGreaterThan(0);
  });

  it("uses maybe as a secondary value after yes and no", () => {
    const ranked = rankAvailabilityOptions(
      [
        { optionId: "fewer-maybe", yesCount: 5, maybeCount: 1, noCount: 2 },
        { optionId: "more-maybe", yesCount: 5, maybeCount: 3, noCount: 2 },
      ],
      8,
    );

    expect(ranked[0]?.optionId).toBe("more-maybe");
  });

  it("marks unanimous, all-but-one, and highest-yes options", () => {
    const ranked = rankAvailabilityOptions(
      [
        { optionId: "everyone", yesCount: 8, maybeCount: 0, noCount: 0 },
        { optionId: "almost", yesCount: 6, maybeCount: 1, noCount: 1 },
        { optionId: "split", yesCount: 4, maybeCount: 1, noCount: 3 },
      ],
      8,
    );

    const everyone = ranked.find((item) => item.optionId === "everyone");
    const almost = ranked.find((item) => item.optionId === "almost");
    const split = ranked.find((item) => item.optionId === "split");

    expect(everyone).toMatchObject({
      unanimous: true,
      allButOneCanAttend: false,
      highestYes: true,
    });
    expect(almost).toMatchObject({
      unanimous: false,
      allButOneCanAttend: true,
      highestYes: false,
    });
    expect(split).toMatchObject({
      unanimous: false,
      allButOneCanAttend: false,
      highestYes: false,
    });
  });
});
