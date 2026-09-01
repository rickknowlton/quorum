import { describe, expect, it } from "vitest";
import { answersFromParticipant } from "@/lib/responses/hydrate";

describe("answersFromParticipant", () => {
  it("restores every selected multiple-choice option", () => {
    const answers = answersFromParticipant(
      [
        {
          id: "q-topics",
          type: "multiple_choice",
          title: "Topics?",
          description: null,
          required: true,
          sortOrder: 0,
          settingsJson: { allowMultiple: true },
          options: [
            { id: "opt-a", label: "A" },
            { id: "opt-b", label: "B" },
            { id: "opt-c", label: "C" },
          ],
        } as never,
      ],
      {
        responses: [
          { questionId: "q-topics", optionId: "opt-a", value: "opt-a" },
          { questionId: "q-topics", optionId: "opt-c", value: "opt-c" },
        ],
      },
    );

    expect(answers).toEqual([
      {
        type: "multiple_choice",
        questionId: "q-topics",
        optionIds: ["opt-a", "opt-c"],
      },
    ]);
  });
});
