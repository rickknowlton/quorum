import { describe, expect, it } from "vitest";
import { wallTimeToUtc } from "@/lib/dates/format";
import { draftsFromPollQuestions } from "@/lib/polls/drafts";

const timezone = "America/New_York";

describe("draftsFromPollQuestions", () => {
  it("nests a yes/no follow-up and keeps option ids", () => {
    const duesId = "11111111-1111-4111-8111-111111111111";
    const whyId = "22222222-2222-4222-8222-222222222222";
    const formatId = "33333333-3333-4333-8333-333333333333";
    const pprId = "44444444-4444-4444-8444-444444444444";
    const wedId = "55555555-5555-4555-8555-555555555555";

    const drafts = draftsFromPollQuestions(
      [
        {
          id: "00000000-0000-4000-8000-000000000000",
          type: "availability",
          title: "When?",
          description: null,
          required: true,
          sortOrder: 0,
          settingsJson: null,
          options: [
            {
              id: wedId,
              label: null,
              startsAt: wallTimeToUtc("2026-08-26", "19:00", timezone),
              endsAt: wallTimeToUtc("2026-08-26", "22:00", timezone),
              sortOrder: 0,
            },
          ],
        },
        {
          id: duesId,
          type: "yes_no",
          title: "Increase dues?",
          description: null,
          required: true,
          sortOrder: 1,
          settingsJson: null,
          options: [],
        },
        {
          id: whyId,
          type: "text",
          title: "Why yes?",
          description: null,
          required: false,
          sortOrder: 2,
          settingsJson: { showIf: { questionId: duesId, values: ["yes"] } },
          options: [],
        },
        {
          id: formatId,
          type: "multiple_choice",
          title: "Format?",
          description: null,
          required: true,
          sortOrder: 3,
          settingsJson: { allowMultiple: true },
          options: [{ id: pprId, label: "Full PPR", startsAt: null, endsAt: null, sortOrder: 0 }],
        },
      ],
      timezone,
    );

    expect(drafts.map((question) => question.id)).toEqual([
      "00000000-0000-4000-8000-000000000000",
      duesId,
      formatId,
    ]);
    expect(drafts[0]?.dates[0]?.ranges[0]).toMatchObject({
      id: wedId,
      start: "19:00",
      end: "22:00",
    });
    expect(drafts[1]).toMatchObject({
      followUpEnabled: true,
      followUpWhen: "yes",
      followUpTitle: "Why yes?",
      followUpRequired: false,
    });
    expect(drafts[2]?.choices).toEqual([{ id: pprId, label: "Full PPR" }]);
    expect(drafts[2]?.allowMultiple).toBe(true);
  });
});
