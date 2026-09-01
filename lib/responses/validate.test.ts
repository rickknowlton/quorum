import { describe, expect, it } from "vitest";
import { findMissingRequiredAnswers, hasInvalidMaybeVotes } from "@/lib/responses/validate";

const questions = [
  {
    id: "q-avail",
    type: "availability" as const,
    title: "When can you draft?",
    required: true,
    optionIds: ["opt-1", "opt-2"],
  },
  {
    id: "q-dues",
    type: "yes_no" as const,
    title: "Increase dues?",
    required: true,
    optionIds: [],
  },
  {
    id: "q-format",
    type: "multiple_choice" as const,
    title: "Scoring format?",
    required: true,
    optionIds: ["ppr", "half"],
  },
  {
    id: "q-notes",
    type: "text" as const,
    title: "Anything else?",
    required: false,
    optionIds: [],
  },
];

describe("required question validation", () => {
  it("returns missing required questions when answers are incomplete", () => {
    const missing = findMissingRequiredAnswers(questions, [
      {
        type: "availability",
        questionId: "q-avail",
        selections: { "opt-1": "yes", "opt-2": "" },
      },
      { type: "yes_no", questionId: "q-dues", value: "" },
      { type: "multiple_choice", questionId: "q-format", optionId: "" },
      { type: "text", questionId: "q-notes", value: "" },
    ]);

    expect(missing.map((item) => item.questionId)).toEqual(["q-dues", "q-format"]);
  });

  it("treats a required availability question as unanswered until one time is marked", () => {
    const missing = findMissingRequiredAnswers(questions, [
      {
        type: "availability",
        questionId: "q-avail",
        selections: { "opt-1": "", "opt-2": "" },
      },
      { type: "yes_no", questionId: "q-dues", value: "yes" },
      { type: "multiple_choice", questionId: "q-format", optionId: "ppr" },
      { type: "text", questionId: "q-notes", value: "" },
    ]);

    expect(missing.map((item) => item.questionId)).toEqual(["q-avail"]);
  });

  it("accepts complete required answers and optional empty text", () => {
    const missing = findMissingRequiredAnswers(questions, [
      {
        type: "availability",
        questionId: "q-avail",
        selections: { "opt-1": "yes", "opt-2": "no" },
      },
      { type: "yes_no", questionId: "q-dues", value: "yes" },
      { type: "multiple_choice", questionId: "q-format", optionId: "ppr" },
      { type: "text", questionId: "q-notes", value: "   " },
    ]);

    expect(missing).toEqual([]);
  });

  it("treats a required multiple-choice answer as incomplete when the option is not on that question", () => {
    const missing = findMissingRequiredAnswers(questions, [
      {
        type: "availability",
        questionId: "q-avail",
        selections: { "opt-1": "yes", "opt-2": "" },
      },
      { type: "yes_no", questionId: "q-dues", value: "yes" },
      { type: "multiple_choice", questionId: "q-format", optionId: "opt-1" },
    ]);

    expect(missing.map((item) => item.questionId)).toEqual(["q-format"]);
  });

  it("rejects maybe votes when the poll disables them", () => {
    expect(
      hasInvalidMaybeVotes(
        [
          {
            type: "availability",
            questionId: "q-avail",
            selections: { "opt-1": "maybe" },
          },
        ],
        false,
      ),
    ).toBe(true);
  });

  it("skips a required follow-up until the parent yes/no is a matching answer", () => {
    const withFollowUp = [
      ...questions,
      {
        id: "q-why",
        type: "text" as const,
        title: "Why yes?",
        required: true,
        optionIds: [],
        showIf: { questionId: "q-dues", values: ["yes"] as Array<"yes" | "no"> },
      },
    ];

    expect(
      findMissingRequiredAnswers(withFollowUp, [
        {
          type: "availability",
          questionId: "q-avail",
          selections: { "opt-1": "yes", "opt-2": "no" },
        },
        { type: "yes_no", questionId: "q-dues", value: "no" },
        { type: "multiple_choice", questionId: "q-format", optionId: "ppr" },
        { type: "text", questionId: "q-notes", value: "" },
        { type: "text", questionId: "q-why", value: "" },
      ]).map((item) => item.questionId),
    ).toEqual([]);

    expect(
      findMissingRequiredAnswers(withFollowUp, [
        {
          type: "availability",
          questionId: "q-avail",
          selections: { "opt-1": "yes", "opt-2": "no" },
        },
        { type: "yes_no", questionId: "q-dues", value: "yes" },
        { type: "multiple_choice", questionId: "q-format", optionId: "ppr" },
        { type: "text", questionId: "q-notes", value: "" },
        { type: "text", questionId: "q-why", value: "" },
      ]).map((item) => item.questionId),
    ).toEqual(["q-why"]);
  });
});
