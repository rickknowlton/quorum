import { describe, expect, it } from "vitest";
import { canFinalizeAvailabilityOption, buildResponseRows } from "@/lib/responses/build-rows";
import type { QuestionAnswer } from "@/lib/responses/validate";

const availabilityA = {
  id: "q-avail-a",
  type: "availability" as const,
  title: "When can you draft?",
  description: null,
  required: true,
  sortOrder: 0,
  settingsJson: null,
  options: [
    { id: "opt-a1", label: "Mon" },
    { id: "opt-a2", label: "Tue" },
  ],
};

const availabilityB = {
  id: "q-avail-b",
  type: "availability" as const,
  title: "Backup times",
  description: null,
  required: false,
  sortOrder: 1,
  settingsJson: null,
  options: [{ id: "opt-b1", label: "Wed" }],
};

const choice = {
  id: "q-choice",
  type: "multiple_choice" as const,
  title: "Scoring?",
  description: null,
  required: true,
  sortOrder: 2,
  settingsJson: null,
  options: [
    { id: "opt-ppr", label: "PPR" },
    { id: "opt-half", label: "Half" },
  ],
};

const dues = {
  id: "q-dues",
  type: "yes_no" as const,
  title: "Increase dues?",
  description: null,
  required: true,
  sortOrder: 3,
  settingsJson: null,
  options: [],
};

const followUp = {
  id: "q-why",
  type: "text" as const,
  title: "Why yes?",
  description: null,
  required: false,
  sortOrder: 4,
  settingsJson: { showIf: { questionId: "q-dues", values: ["yes"] } },
  options: [],
};

const poll = {
  questions: [availabilityA, availabilityB, choice, dues, followUp],
};

function rowsFor(answers: QuestionAnswer[]) {
  return buildResponseRows(poll, "participant-1", answers);
}

describe("cross-question option rejection", () => {
  it("drops availability options that belong to a different question", () => {
    const rows = rowsFor([
      {
        type: "availability",
        questionId: "q-avail-a",
        selections: { "opt-a1": "yes", "opt-b1": "yes" },
      },
    ]);

    expect(rows).toEqual([
      {
        participantId: "participant-1",
        questionId: "q-avail-a",
        optionId: "opt-a1",
        value: "yes",
      },
    ]);
  });

  it("drops a multiple-choice option that belongs to another question", () => {
    const rows = rowsFor([
      {
        type: "multiple_choice",
        questionId: "q-choice",
        optionIds: ["opt-a1"],
      },
    ]);

    expect(rows).toEqual([]);
  });

  it("keeps a multiple-choice option that belongs to that question", () => {
    const rows = rowsFor([
      {
        type: "multiple_choice",
        questionId: "q-choice",
        optionIds: ["opt-ppr"],
      },
    ]);

    expect(rows).toEqual([
      {
        participantId: "participant-1",
        questionId: "q-choice",
        optionId: "opt-ppr",
        value: "opt-ppr",
      },
    ]);
  });

  it("stores every selected option when multi-select is enabled", () => {
    const rows = buildResponseRows(
      {
        questions: [{ ...choice, settingsJson: { allowMultiple: true } }],
      },
      "participant-1",
      [
        {
          type: "multiple_choice",
          questionId: "q-choice",
          optionIds: ["opt-ppr", "opt-half", "opt-a1"],
        },
      ],
    );

    expect(rows.map((row) => row.optionId)).toEqual(["opt-ppr", "opt-half"]);
  });

  it("keeps only the first valid option on a single-select question", () => {
    const rows = rowsFor([
      {
        type: "multiple_choice",
        questionId: "q-choice",
        optionIds: ["opt-ppr", "opt-half"],
      },
    ]);

    expect(rows.map((row) => row.optionId)).toEqual(["opt-ppr"]);
  });
});

describe("follow-up and type checks", () => {
  it("discards a hidden follow-up answer", () => {
    const rows = rowsFor([
      { type: "yes_no", questionId: "q-dues", value: "no" },
      { type: "text", questionId: "q-why", value: "forged follow-up" },
    ]);

    expect(rows).toEqual([
      {
        participantId: "participant-1",
        questionId: "q-dues",
        value: "no",
      },
    ]);
  });

  it("stores a visible follow-up", () => {
    const rows = rowsFor([
      { type: "yes_no", questionId: "q-dues", value: "yes" },
      { type: "text", questionId: "q-why", value: "because" },
    ]);

    expect(rows.map((row) => row.questionId)).toEqual(["q-dues", "q-why"]);
  });

  it("ignores an answer whose type does not match the question", () => {
    const rows = rowsFor([
      { type: "yes_no", questionId: "q-avail-a", value: "yes" },
    ]);

    expect(rows).toEqual([]);
  });
});

describe("finalization association", () => {
  it("rejects an option from another availability question", () => {
    expect(canFinalizeAvailabilityOption(availabilityA as never, "opt-b1")).toBe(false);
    expect(canFinalizeAvailabilityOption(availabilityA as never, "opt-a1")).toBe(true);
    expect(canFinalizeAvailabilityOption(choice as never, "opt-ppr")).toBe(false);
  });
});
