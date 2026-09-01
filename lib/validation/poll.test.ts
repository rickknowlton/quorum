import { describe, expect, it } from "vitest";
import { PARTICIPANT_NAME_MAX, POLL_TITLE_MAX, TEXT_RESPONSE_MAX } from "@/lib/validation/limits";
import { createPollSchema, submitResponseSchema } from "@/lib/validation/poll";

describe("input ceilings", () => {
  it("rejects oversized poll titles and descriptions", () => {
    const result = createPollSchema.safeParse({
      title: "Q".repeat(POLL_TITLE_MAX + 1),
      timezone: "America/New_York",
      questions: [
        {
          type: "yes_no",
          title: "Ready?",
          required: true,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects oversized participant names and free-text answers", () => {
    const name = submitResponseSchema.safeParse({
      name: "N".repeat(PARTICIPANT_NAME_MAX + 1),
      answers: [],
    });
    const text = submitResponseSchema.safeParse({
      name: "Rick",
      answers: [
        {
          type: "text",
          questionId: "00000000-0000-4000-8000-000000000001",
          value: "x".repeat(TEXT_RESPONSE_MAX + 1),
        },
      ],
    });

    expect(name.success).toBe(false);
    expect(text.success).toBe(false);
  });
});
