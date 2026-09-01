import { z } from "zod";
import { isValidTimeRange } from "@/lib/dates/format";
import {
  ANSWERS_PER_SUBMIT_MAX,
  AVAILABILITY_SLOTS_MAX,
  CHOICES_PER_QUESTION_MAX,
  EDIT_TOKEN_MAX,
  FOLLOW_UP_TITLE_MAX,
  OPTION_LABEL_MAX,
  PARTICIPANT_NAME_MAX,
  POLL_DESCRIPTION_MAX,
  POLL_TITLE_MAX,
  QUESTION_DESCRIPTION_MAX,
  QUESTION_TITLE_MAX,
  QUESTIONS_PER_POLL_MAX,
  TEXT_RESPONSE_MAX,
} from "@/lib/validation/limits";

export const questionTypes = [
  "availability",
  "yes_no",
  "multiple_choice",
  "text",
] as const;

const titleSchema = z
  .string()
  .trim()
  .min(1, "Enter a question")
  .max(QUESTION_TITLE_MAX, "Question is too long");
const descriptionSchema = z
  .string()
  .trim()
  .max(QUESTION_DESCRIPTION_MAX, "Description is too long")
  .optional();

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
    title: titleSchema,
    description: descriptionSchema,
    required: z.boolean(),
    ranges: z
      .array(availabilityRangeSchema)
      .min(1, "Add at least one candidate time")
      .max(AVAILABILITY_SLOTS_MAX, "Too many times"),
  }),
  z.object({
    id: z.uuid().optional(),
    type: z.literal("yes_no"),
    title: titleSchema,
    description: descriptionSchema,
    required: z.boolean(),
    followUp: z
      .object({
        when: z.enum(["yes", "no", "either"]),
        title: z
          .string()
          .trim()
          .min(1, "Enter a follow-up question")
          .max(FOLLOW_UP_TITLE_MAX, "Follow-up is too long"),
        required: z.boolean(),
      })
      .optional(),
  }),
  z.object({
    id: z.uuid().optional(),
    type: z.literal("multiple_choice"),
    title: titleSchema,
    description: descriptionSchema,
    required: z.boolean(),
    options: z
      .array(
        z.object({
          id: z.uuid().optional(),
          label: z
            .string()
            .trim()
            .min(1, "Enter a choice")
            .max(OPTION_LABEL_MAX, "Choice is too long"),
        }),
      )
      .min(2, "Add at least two choices")
      .max(CHOICES_PER_QUESTION_MAX, "Too many choices"),
  }),
  z.object({
    id: z.uuid().optional(),
    type: z.literal("text"),
    title: titleSchema,
    description: descriptionSchema,
    required: z.boolean(),
  }),
]);

export const createPollSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a poll title")
    .max(POLL_TITLE_MAX, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(POLL_DESCRIPTION_MAX, "Description is too long")
    .optional(),
  timezone: z.string().trim().min(1, "Timezone is required").max(64),
  allowResponseEditing: z.boolean().default(true),
  showParticipantNames: z.boolean().default(true),
  showResults: z.boolean().default(false),
  allowMaybe: z.boolean().default(true),
  questions: z
    .array(createQuestionSchema)
    .min(1, "Add at least one question")
    .max(QUESTIONS_PER_POLL_MAX, "Too many questions"),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

export const updatePollQuestionsSchema = z.object({
  questions: z
    .array(createQuestionSchema)
    .min(1, "Add at least one question")
    .max(QUESTIONS_PER_POLL_MAX, "Too many questions"),
});

export type UpdatePollQuestionsInput = z.infer<typeof updatePollQuestionsSchema>;

export const updatePollSettingsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Enter a poll title")
    .max(POLL_TITLE_MAX, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(POLL_DESCRIPTION_MAX, "Description is too long")
    .optional(),
  deadlineAt: z.string().optional(),
  allowResponseEditing: z.boolean(),
  showParticipantNames: z.boolean(),
  showResults: z.boolean(),
  allowMaybe: z.boolean(),
});

export const submitResponseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(PARTICIPANT_NAME_MAX, "Name is too long"),
  editToken: z.string().max(EDIT_TOKEN_MAX).optional(),
  answers: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("availability"),
          questionId: z.uuid(),
          selections: z
            .record(z.string(), z.enum(["yes", "maybe", "no", ""]))
            .refine((selections) => Object.keys(selections).length <= AVAILABILITY_SLOTS_MAX, {
              message: "Too many times",
            }),
        }),
        z.object({
          type: z.literal("yes_no"),
          questionId: z.uuid(),
          value: z.enum(["yes", "no", ""]),
        }),
        z.object({
          type: z.literal("multiple_choice"),
          questionId: z.uuid(),
          optionId: z.string().max(64),
        }),
        z.object({
          type: z.literal("text"),
          questionId: z.uuid(),
          value: z.string().max(TEXT_RESPONSE_MAX, "Response is too long"),
        }),
      ]),
    )
    .max(ANSWERS_PER_SUBMIT_MAX, "Too many answers"),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
