import { describe, expect, it } from "vitest";
import { buildQuestionResults } from "@/lib/results/build";
import type { PollParticipant, PollQuestion } from "@/lib/polls/queries";

describe("multiple choice results", () => {
  it("counts each selected option per person and percentages of people who answered", () => {
    const question = {
      id: "q-topics",
      type: "multiple_choice",
      title: "Topics?",
      options: [
        { id: "opt-a", label: "Website" },
        { id: "opt-b", label: "Outreach" },
        { id: "opt-c", label: "Dues" },
      ],
    } as PollQuestion;

    const participants = [
      {
        id: "p1",
        name: "Rick",
        responses: [
          { questionId: "q-topics", optionId: "opt-a", value: "opt-a" },
          { questionId: "q-topics", optionId: "opt-b", value: "opt-b" },
        ],
      },
      {
        id: "p2",
        name: "Kyle",
        responses: [{ questionId: "q-topics", optionId: "opt-a", value: "opt-a" }],
      },
      {
        id: "p3",
        name: "Andrew",
        responses: [],
      },
    ] as unknown as PollParticipant[];

    const result = buildQuestionResults(question, participants);
    if (result.type !== "multiple_choice") {
      throw new Error("expected multiple_choice results");
    }

    expect(result.tallies).toEqual([
      { optionId: "opt-a", label: "Website", count: 2, percentage: 100 },
      { optionId: "opt-b", label: "Outreach", count: 1, percentage: 50 },
      { optionId: "opt-c", label: "Dues", count: 0, percentage: 0 },
    ]);
  });
});
