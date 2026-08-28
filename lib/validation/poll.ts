import { z } from "zod";
import { isValidTimeRange } from "@/lib/dates/format";

export const questionTypes = [
  "availability",
  "yes_no",
  "multiple_choice",
  "text",
] as const;

const availabilityRangeSchema = z
  .object({
    id: z.uuid().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    start: z.string().regex(/^\d{1,2}:\d{2}$/, "Choose a start time"),
    end: z.string().regex(/^\d{1,2}:\d{2}$/, "Choose an end time"),
  })
  .refine((range) => isValidTimeRange(range.start, range.end), {
    message: "End time must be after start time",
    path: ["end"],
  });

const createQuestionSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.uuid().optional(),
    type: z.literal("availability"),
    title: z.string().trim().min(1, "Enter a question"),
    description: z.string().trim().optional(),
    required: z.boolean(),
    ranges: z.array(availabilityRangeSchema).min(1, "Add at least one candidate time"),
  }),
  z.object({
    id: z.uuid().optional(),
    type: z.literal("yes_no"),
    title: z.string().trim().min(1, "Enter a question"),
    description: z.string().trim().optional(),
    required: z.boolean(),
    followUp: z
      .object({
        when: z.enum(["yes", "no", "either"]),
        title: z.string().trim().min(1, "Enter a follow-up question"),
        required: z.boolean(),
      })
      .optional(),
  }),
  z.object({
    id: z.uuid().optional(),
    type: z.literal("multiple_choice"),
    title: z.string().trim().min(1, "Enter a question"),
    description: z.string().trim().optional(),
    required: z.boolean(),
    options: z
      .array(
        z.object({
          id: z.uuid().optional(),
          label: z.string().trim().min(1, "Enter a choice"),
        }),
      )
      .min(2, "Add at least two choices"),
  }),
  z.object({
    id: z.uuid().optional(),
    type: z.literal("text"),
    title: z.string().trim().min(1, "Enter a question"),
    description: z.string().trim().optional(),
    required: z.boolean(),
  }),
]);

export const createPollSchema = z.object({
  title: z.string().trim().min(1, "Enter a poll title"),
  description: z.string().trim().optional(),
  timezone: z.string().trim().min(1, "Timezone is required"),
  allowResponseEditing: z.boolean().default(true),
  showParticipantNames: z.boolean().default(true),
  showResults: z.boolean().default(false),
  allowMaybe: z.boolean().default(true),
  questions: z.array(createQuestionSchema).min(1, "Add at least one question"),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

export const updatePollQuestionsSchema = z.object({
  questions: z.array(createQuestionSchema).min(1, "Add at least one question"),
});

export type UpdatePollQuestionsInput = z.infer<typeof updatePollQuestionsSchema>;

export const updatePollSettingsSchema = z.object({
  title: z.string().trim().min(1, "Enter a poll title"),
  description: z.string().trim().optional(),
  deadlineAt: z.string().optional(),
  allowResponseEditing: z.boolean(),
  showParticipantNames: z.boolean(),
  showResults: z.boolean(),
  allowMaybe: z.boolean(),
});

export const submitResponseSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80, "Name is too long"),
  editToken: z.string().optional(),
  answers: z.array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("availability"),
        questionId: z.uuid(),
        selections: z.record(z.string(), z.enum(["yes", "maybe", "no", ""])),
      }),
      z.object({
        type: z.literal("yes_no"),
        questionId: z.uuid(),
        value: z.enum(["yes", "no", ""]),
      }),
      z.object({
        type: z.literal("multiple_choice"),
        questionId: z.uuid(),
        optionId: z.string(),
      }),
      z.object({
        type: z.literal("text"),
        questionId: z.uuid(),
        value: z.string(),
      }),
    ]),
  ),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
