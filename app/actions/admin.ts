"use server";

import { cookies } from "next/headers";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  finalizations,
  participants,
  polls,
  questionOptions,
  questions,
} from "@/db/schema";
import { getOrganizerAccess } from "@/lib/auth/access";
import {
  authCookieDeleteOptions,
  editCookieName,
  matchesStoredSecret,
} from "@/lib/auth/tokens";
import { isDatabaseUnavailable } from "@/lib/db/connection-error";
import { wallTimeToUtc } from "@/lib/dates/format";
import { followUpValues, multipleChoiceSettingsJson, parseShowIf } from "@/lib/polls/question-settings";
import { getPollByPublicId, type PollWithDetails } from "@/lib/polls/queries";
import { canFinalizeAvailabilityOption } from "@/lib/responses/build-rows";
import {
  updatePollQuestionsSchema,
  updatePollSettingsSchema,
} from "@/lib/validation/poll";
import { revalidatePath } from "next/cache";

async function requireAdminPoll(
  publicId: string,
  token?: string,
): Promise<{ poll: PollWithDetails } | { error: string }> {
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    return { error: "Poll not found." };
  }

  const access = await getOrganizerAccess(poll, token);
  if (!access.authorized) {
    return { error: "Invalid admin link." };
  }

  return { poll };
}

export async function updatePollSettingsAction(
  publicId: string,
  token: string | undefined,
  formData: FormData,
): Promise<void> {
  const access = await requireAdminPoll(publicId, token);
  if ("error" in access) {
    throw new Error(access.error);
  }

  const parsed = updatePollSettingsSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    deadlineAt: String(formData.get("deadlineAt") ?? ""),
    allowResponseEditing: formData.get("allowResponseEditing") === "on",
    showParticipantNames: formData.get("showParticipantNames") === "on",
    showResults: formData.get("showResults") === "on",
    allowMaybe: formData.get("allowMaybe") === "on",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid settings.");
  }

  let deadlineAt: Date | null = null;
  if (parsed.data.deadlineAt) {
    const [date, time] = parsed.data.deadlineAt.split("T");
    if (!date || !time) {
      throw new Error("Enter a valid deadline.");
    }
    deadlineAt = wallTimeToUtc(date, time.slice(0, 5), access.poll.timezone);
  }

  await db
    .update(polls)
    .set({
      title: parsed.data.title,
      description: parsed.data.description || null,
      deadlineAt,
      allowResponseEditing: parsed.data.allowResponseEditing,
      showParticipantNames: parsed.data.showParticipantNames,
      showResults: parsed.data.showResults,
      allowMaybe: parsed.data.allowMaybe,
      updatedAt: new Date(),
    })
    .where(eq(polls.id, access.poll.id));

  revalidatePath(`/q/${publicId}`);
  revalidatePath(`/q/${publicId}/admin`);
  revalidatePath("/dashboard");
}

export async function setPollStatusAction(
  publicId: string,
  token: string | undefined,
  status: "open" | "closed",
  _formData?: FormData,
): Promise<void> {
  void _formData;
  const access = await requireAdminPoll(publicId, token);
  if ("error" in access) {
    throw new Error(access.error);
  }

  await db
    .update(polls)
    .set({ status, updatedAt: new Date() })
    .where(eq(polls.id, access.poll.id));

  revalidatePath(`/q/${publicId}`);
  revalidatePath(`/q/${publicId}/admin`);
  revalidatePath("/dashboard");
}

export async function deleteParticipantAction(
  publicId: string,
  token: string | undefined,
  participantId: string,
  _formData?: FormData,
): Promise<void> {
  void _formData;
  const access = await requireAdminPoll(publicId, token);
  if ("error" in access) {
    throw new Error(access.error);
  }

  const existing = await db.query.participants.findFirst({
    where: and(eq(participants.id, participantId), eq(participants.pollId, access.poll.id)),
  });
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(editCookieName(publicId))?.value;
  if (existing && cookieToken && matchesStoredSecret(cookieToken, existing.editToken)) {
    cookieStore.delete({
      name: editCookieName(publicId),
      ...authCookieDeleteOptions(publicId),
    });
  }

  await db
    .delete(participants)
    .where(
      and(eq(participants.id, participantId), eq(participants.pollId, access.poll.id)),
    );

  revalidatePath(`/q/${publicId}`);
  revalidatePath(`/q/${publicId}/admin`);
}

export async function finalizeOptionAction(
  publicId: string,
  token: string | undefined,
  questionId: string,
  optionId: string,
  _formData?: FormData,
): Promise<void> {
  void _formData;
  const access = await requireAdminPoll(publicId, token);
  if ("error" in access) {
    throw new Error(access.error);
  }

  const question = access.poll.questions.find((item) => item.id === questionId);
  if (!canFinalizeAvailabilityOption(question, optionId)) {
    throw new Error("That time is no longer available.");
  }

  await db
    .insert(finalizations)
    .values({ questionId, optionId })
    .onConflictDoUpdate({
      target: finalizations.questionId,
      set: { optionId },
    });

  revalidatePath(`/q/${publicId}`);
  revalidatePath(`/q/${publicId}/admin`);
}

export async function clearFinalizationAction(
  publicId: string,
  token: string | undefined,
  questionId: string,
  _formData?: FormData,
): Promise<void> {
  void _formData;
  const access = await requireAdminPoll(publicId, token);
  if ("error" in access) {
    throw new Error(access.error);
  }

  await db.delete(finalizations).where(eq(finalizations.questionId, questionId));
  revalidatePath(`/q/${publicId}`);
  revalidatePath(`/q/${publicId}/admin`);
}

export async function addAvailabilityRangeAction(
  publicId: string,
  token: string | undefined,
  questionId: string,
  formData: FormData,
): Promise<void> {
  const access = await requireAdminPoll(publicId, token);
  if ("error" in access) {
    throw new Error(access.error);
  }

  const question = access.poll.questions.find((item) => item.id === questionId);
  if (!question || question.type !== "availability") {
    throw new Error("Question not found.");
  }

  const date = String(formData.get("date") ?? "");
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");

  try {
    const startsAt = wallTimeToUtc(date, start, access.poll.timezone);
    const endsAt = wallTimeToUtc(date, end, access.poll.timezone);
    if (endsAt <= startsAt) {
      throw new Error("End time must be after start time.");
    }

    await db.insert(questionOptions).values({
      questionId,
      startsAt,
      endsAt,
      sortOrder: question.options.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Enter a valid date and time range.");
  }

  revalidatePath(`/q/${publicId}`);
  revalidatePath(`/q/${publicId}/admin`);
  revalidatePath(`/q/${publicId}/admin/questions`);
}

export async function updatePollQuestionsAction(
  publicId: string,
  token: string | undefined,
  input: unknown,
): Promise<{ error: string } | { ok: true }> {
  const access = await requireAdminPoll(publicId, token);
  if ("error" in access) {
    return { error: access.error };
  }

  const poll = access.poll;

  const parsed = updatePollQuestionsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the questions and try again." };
  }

  try {
    await db.transaction(async (tx) => {
      const existingById = new Map(poll.questions.map((question) => [question.id, question]));
      const keepQuestionIds = new Set<string>();
      let sortOrder = 0;

      for (const draft of parsed.data.questions) {
        const existing = draft.id ? existingById.get(draft.id) : undefined;
        if (existing && existing.type !== draft.type) {
          throw new Error("Question type cannot be changed.");
        }

        const settingsJson =
          draft.type === "multiple_choice"
            ? multipleChoiceSettingsJson(draft.allowMultiple)
            : null;

        const questionId = existing
          ? (
              await tx
                .update(questions)
                .set({
                  title: draft.title,
                  description: draft.description || null,
                  required: draft.required,
                  sortOrder,
                  settingsJson,
                  updatedAt: new Date(),
                })
                .where(eq(questions.id, existing.id))
                .returning({ id: questions.id })
            )[0]?.id
          : (
              await tx
                .insert(questions)
                .values({
                  pollId: poll.id,
                  type: draft.type,
                  title: draft.title,
                  description: draft.description || null,
                  required: draft.required,
                  sortOrder,
                  settingsJson,
                })
                .returning({ id: questions.id })
            )[0]?.id;

        if (!questionId) {
          throw new Error("Failed to save a question.");
        }

        keepQuestionIds.add(questionId);
        sortOrder += 1;

        if (draft.type === "availability") {
          await syncAvailabilityOptions(
            tx,
            questionId,
            existing?.options ?? [],
            draft.ranges,
            poll.timezone,
          );
        }

        if (draft.type === "multiple_choice") {
          await syncChoiceOptions(tx, questionId, existing?.options ?? [], draft.options);
        }

        if (draft.type === "yes_no" && draft.followUp) {
          const followUpId = await upsertFollowUp(
            tx,
            poll.id,
            questionId,
            existingById,
            draft.followUp,
            sortOrder,
          );
          keepQuestionIds.add(followUpId);
          sortOrder += 1;
        }
      }

      const staleIds = poll.questions
        .map((question) => question.id)
        .filter((id) => !keepQuestionIds.has(id));
      if (staleIds.length > 0) {
        await tx.delete(questions).where(inArray(questions.id, staleIds));
      }
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === "Question type cannot be changed.") {
      return { error: error.message };
    }
    if (isDatabaseUnavailable(error)) {
      return {
        error: "Could not reach the database. Make sure PostgreSQL is running, then try again.",
      };
    }
    return { error: "Could not save questions. Please try again." };
  }

  revalidatePath(`/q/${publicId}`);
  revalidatePath(`/q/${publicId}/admin`);
  revalidatePath(`/q/${publicId}/admin/questions`);
  revalidatePath(`/q/${publicId}/results`);
  return { ok: true };
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type ExistingOption = {
  id: string;
  label: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
};

async function upsertFollowUp(
  tx: DbTransaction,
  pollId: string,
  parentId: string,
  existingById: Map<string, { id: string; settingsJson: Record<string, unknown> | null }>,
  followUp: { when: "yes" | "no" | "either"; title: string; required: boolean },
  sortOrder: number,
) {
  const existingFollowUp = [...existingById.values()].find((question) => {
    const showIf = parseShowIf(question.settingsJson);
    return showIf?.questionId === parentId;
  });

  const settingsJson = {
    showIf: { questionId: parentId, values: followUpValues(followUp.when) },
  };

  if (existingFollowUp) {
    await tx
      .update(questions)
      .set({
        title: followUp.title,
        required: followUp.required,
        sortOrder,
        settingsJson,
        updatedAt: new Date(),
      })
      .where(eq(questions.id, existingFollowUp.id));
    return existingFollowUp.id;
  }

  const [created] = await tx
    .insert(questions)
    .values({
      pollId,
      type: "text",
      title: followUp.title,
      required: followUp.required,
      sortOrder,
      settingsJson,
    })
    .returning({ id: questions.id });

  if (!created) {
    throw new Error("Failed to save a follow-up question.");
  }
  return created.id;
}

async function syncAvailabilityOptions(
  tx: DbTransaction,
  questionId: string,
  existing: ExistingOption[],
  ranges: Array<{ id?: string; date: string; start: string; end: string }>,
  timezone: string,
) {
  const existingById = new Map(existing.map((option) => [option.id, option]));
  const keepIds = new Set<string>();

  for (const [index, range] of ranges.entries()) {
    const startsAt = wallTimeToUtc(range.date, range.start, timezone);
    const endsAt = wallTimeToUtc(range.date, range.end, timezone);
    const current = range.id ? existingById.get(range.id) : undefined;
    if (current) {
      await tx
        .update(questionOptions)
        .set({ startsAt, endsAt, sortOrder: index })
        .where(eq(questionOptions.id, current.id));
      keepIds.add(current.id);
      continue;
    }
    const [created] = await tx
      .insert(questionOptions)
      .values({
        questionId,
        startsAt,
        endsAt,
        sortOrder: index,
      })
      .returning({ id: questionOptions.id });
    if (created) {
      keepIds.add(created.id);
    }
  }

  await deleteStaleOptions(tx, questionId, keepIds);
}

async function syncChoiceOptions(
  tx: DbTransaction,
  questionId: string,
  existing: ExistingOption[],
  options: Array<{ id?: string; label: string }>,
) {
  const existingById = new Map(existing.map((option) => [option.id, option]));
  const keepIds = new Set<string>();

  for (const [index, option] of options.entries()) {
    const current = option.id ? existingById.get(option.id) : undefined;
    if (current) {
      await tx
        .update(questionOptions)
        .set({ label: option.label, sortOrder: index })
        .where(eq(questionOptions.id, current.id));
      keepIds.add(current.id);
      continue;
    }
    const [created] = await tx
      .insert(questionOptions)
      .values({
        questionId,
        label: option.label,
        sortOrder: index,
      })
      .returning({ id: questionOptions.id });
    if (created) {
      keepIds.add(created.id);
    }
  }

  await deleteStaleOptions(tx, questionId, keepIds);
}

async function deleteStaleOptions(tx: DbTransaction, questionId: string, keepIds: Set<string>) {
  if (keepIds.size === 0) {
    await tx.delete(questionOptions).where(eq(questionOptions.questionId, questionId));
    return;
  }

  await tx
    .delete(questionOptions)
    .where(and(eq(questionOptions.questionId, questionId), notInArray(questionOptions.id, [...keepIds])));
}
