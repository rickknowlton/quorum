import { describe, expect, it } from "vitest";
import {
  followUpValues,
  followUpWhenFromValues,
  isFollowUpVisible,
  parseShowIf,
} from "@/lib/polls/question-settings";

describe("parseShowIf", () => {
  it("reads a valid follow-up condition", () => {
    expect(
      parseShowIf({
        showIf: { questionId: "q-dues", values: ["yes"] },
      }),
    ).toEqual({ questionId: "q-dues", values: ["yes"] });
  });

  it("ignores malformed settings", () => {
    expect(parseShowIf(null)).toBeNull();
    expect(parseShowIf({ showIf: { questionId: "q-dues", values: ["maybe"] } })).toBeNull();
  });
});

describe("isFollowUpVisible", () => {
  it("shows the follow-up only for matching yes/no answers", () => {
    const showIf = { questionId: "q-dues", values: ["yes"] as Array<"yes" | "no"> };
    expect(isFollowUpVisible(showIf, "yes")).toBe(true);
    expect(isFollowUpVisible(showIf, "no")).toBe(false);
    expect(isFollowUpVisible(showIf, "")).toBe(false);
    expect(isFollowUpVisible(null, "yes")).toBe(true);
  });
});

describe("followUpValues", () => {
  it("expands either into both answers", () => {
    expect(followUpValues("either")).toEqual(["yes", "no"]);
    expect(followUpValues("no")).toEqual(["no"]);
  });
});

describe("followUpWhenFromValues", () => {
  it("maps stored yes/no values back to the editor choice", () => {
    expect(followUpWhenFromValues(["yes"])).toBe("yes");
    expect(followUpWhenFromValues(["no"])).toBe("no");
    expect(followUpWhenFromValues(["yes", "no"])).toBe("either");
  });
});
