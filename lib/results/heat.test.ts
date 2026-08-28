import { describe, expect, it } from "vitest";
import { availabilityHeatLevel } from "@/lib/results/heat";

describe("availabilityHeatLevel", () => {
  it("returns 0 when nobody has responded", () => {
    expect(availabilityHeatLevel(0, 0, 0)).toBe(0);
  });

  it("returns 0 when every vote is no", () => {
    expect(availabilityHeatLevel(0, 0, 8)).toBe(0);
  });

  it("ramps up with yes-weighted score", () => {
    expect(availabilityHeatLevel(1, 0, 8)).toBe(1);
    expect(availabilityHeatLevel(3, 0, 8)).toBe(2);
    expect(availabilityHeatLevel(5, 0, 8)).toBe(3);
    expect(availabilityHeatLevel(7, 1, 8)).toBe(4);
  });
});
