import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const pollStatusEnum = pgEnum("poll_status", ["open", "closed"]);

export const questionTypeEnum = pgEnum("question_type", [
  "availability",
  "yes_no",
  "multiple_choice",
  "text",
]);

export const polls = pgTable(
  "polls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicId: varchar("public_id", { length: 21 }).notNull(),
    adminToken: varchar("admin_token", { length: 64 }).notNull(),
    ownerUserId: text("owner_user_id"),
    title: text("title").notNull(),
    description: text("description"),
    timezone: text("timezone").notNull(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    status: pollStatusEnum("status").notNull().default("open"),
    allowResponseEditing: boolean("allow_response_editing").notNull().default(true),
    showParticipantNames: boolean("show_participant_names").notNull().default(true),
    showResults: boolean("show_results").notNull().default(false),
    allowMaybe: boolean("allow_maybe").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("polls_public_id_idx").on(table.publicId),
    uniqueIndex("polls_admin_token_idx").on(table.adminToken),
    index("polls_owner_user_id_idx").on(table.ownerUserId),
  ],
);

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    type: questionTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    required: boolean("required").notNull().default(true),
    sortOrder: integer("sort_order").notNull(),
    settingsJson: jsonb("settings_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("questions_poll_id_idx").on(table.pollId),
    index("questions_poll_id_sort_idx").on(table.pollId, table.sortOrder),
  ],
);

export const questionOptions = pgTable(
  "question_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    label: text("label"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull(),
    metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("question_options_question_id_idx").on(table.questionId)],
);

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .notNull()
      .references(() => polls.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    editToken: varchar("edit_token", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("participants_poll_id_idx").on(table.pollId),
    uniqueIndex("participants_edit_token_idx").on(table.editToken),
  ],
);

export const responses = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    optionId: uuid("option_id").references(() => questionOptions.id, {
      onDelete: "cascade",
    }),
    value: text("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("responses_participant_id_idx").on(table.participantId),
    index("responses_question_id_idx").on(table.questionId),
    index("responses_option_id_idx").on(table.optionId),
    uniqueIndex("responses_participant_question_option_idx")
      .on(table.participantId, table.questionId, table.optionId)
      .where(sql`${table.optionId} is not null`),
    uniqueIndex("responses_participant_question_null_option_idx")
      .on(table.participantId, table.questionId)
      .where(sql`${table.optionId} is null`),
  ],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const finalizations = pgTable("finalizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" })
    .unique(),
  optionId: uuid("option_id")
    .notNull()
    .references(() => questionOptions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pollsRelations = relations(polls, ({ many }) => ({
  questions: many(questions),
  participants: many(participants),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  poll: one(polls, { fields: [questions.pollId], references: [polls.id] }),
  options: many(questionOptions),
  responses: many(responses),
  finalization: one(finalizations),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one, many }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
  responses: many(responses),
  finalizations: many(finalizations),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  poll: one(polls, { fields: [participants.pollId], references: [polls.id] }),
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  participant: one(participants, {
    fields: [responses.participantId],
    references: [participants.id],
  }),
  question: one(questions, {
    fields: [responses.questionId],
    references: [questions.id],
  }),
  option: one(questionOptions, {
    fields: [responses.optionId],
    references: [questionOptions.id],
  }),
}));

export const finalizationsRelations = relations(finalizations, ({ one }) => ({
  question: one(questions, {
    fields: [finalizations.questionId],
    references: [questions.id],
  }),
  option: one(questionOptions, {
    fields: [finalizations.optionId],
    references: [questionOptions.id],
  }),
}));

export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Response = typeof responses.$inferSelect;
export type Finalization = typeof finalizations.$inferSelect;
export type PollStatus = (typeof pollStatusEnum.enumValues)[number];
export type QuestionType = (typeof questionTypeEnum.enumValues)[number];
