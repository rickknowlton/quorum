"use server";

import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { participants, responses } from "@/db/schema";
import { AUTH_COOKIE_OPTIONS, editCookieName, tokensEqual } from "@/lib/auth/tokens";
import { createSecretToken } from "@/lib/ids";
import { isDatabaseUnavailable } from "@/lib/db/connection-error";
import { getPollByPublicId } from "@/lib/polls/queries";
import { isFollowUpVisible, parseShowIf } from "@/lib/polls/question-settings";
import { isAcceptingResponses, pollAcceptanceMessage } from "@/lib/polls/status";
import {
  findMissingRequiredAnswers,
  hasInvalidMaybeVotes,
  type QuestionAnswer,
} from "@/lib/responses/validate";
import { submitResponseSchema } from "@/lib/validation/poll";

function flattenZodError(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "Please check your answers and try again.";
}

export async function submitResponseAction(publicId: string, input: unknown) {
  const parsed = submitResponseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: flattenZodError(parsed.error) };
  }

  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    return { error: "This poll could not be found." };
  }

  const acceptance = isAcceptingResponses(poll);
  if (!acceptance.ok) {
    return { error: pollAcceptanceMessage(acceptance.reason) };
  }

  const answers = parsed.data.answers as QuestionAnswer[];
  const missing = findMissingRequiredAnswers(
    poll.questions.map((question) => ({
      id: question.id,
      type: question.type,
      title: question.title,
      required: question.required,
      optionIds: question.options.map((option) => option.id),
      showIf: parseShowIf(question.settingsJson),
    })),
    answers,
  );

  if (missing.length > 0) {
    return { error: `Please answer: ${missing.map((item) => item.title).join(", ")}` };
  }

  if (hasInvalidMaybeVotes(answers, poll.allowMaybe)) {
    return { error: "This poll does not allow “If needed” responses." };
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(editCookieName(publicId))?.value;
  const presentedToken = parsed.data.editToken || cookieToken;

  try {
    const editToken = await db.transaction(async (tx) => {
      let participant = undefined as
        | {
            id: string;
            editToken: string;
          }
        | undefined;

      if (presentedToken) {
        const existing = await tx.query.participants.findFirst({
          where: and(eq(participants.pollId, poll.id), eq(participants.editToken, presentedToken)),
        });

        if (!existing || !tokensEqual(presentedToken, existing.editToken)) {
          return { error: "This edit link is invalid." };
        }

        if (!poll.allowResponseEditing) {
          return { error: "This poll does not allow editing responses." };
        }

        participant = existing;
        await tx
          .update(participants)
          .set({ name: parsed.data.name, updatedAt: new Date() })
          .where(eq(participants.id, participant.id));
        await tx.delete(responses).where(eq(responses.participantId, participant.id));
      } else {
        const [created] = await tx
          .insert(participants)
          .values({
            pollId: poll.id,
            name: parsed.data.name,
            editToken: createSecretToken(),
          })
          .returning();

        if (!created) {
          throw new Error("Failed to create participant");
        }
        participant = created;
      }

      const rows = buildResponseRows(poll, participant.id, answers);
      if (rows.length > 0) {
        await tx.insert(responses).values(rows);
      }

      return participant.editToken;
    });

    if (typeof editToken === "object") {
      return editToken;
    }

    cookieStore.set(editCookieName(publicId), editToken, AUTH_COOKIE_OPTIONS);
    return { ok: true as const, editToken };
  } catch (error) {
    console.error(error);
    if (isDatabaseUnavailable(error)) {
      return {
        error: "Could not reach the database. Make sure PostgreSQL is running, then try again.",
      };
    }
    return { error: "Could not save your response. Please try again." };
  }
}

function buildResponseRows(
  poll: NonNullable<Awaited<ReturnType<typeof getPollByPublicId>>>,
  participantId: string,
  answers: QuestionAnswer[],
) {
  const questionIds = new Set(poll.questions.map((question) => question.id));
  const optionIds = new Set(
    poll.questions.flatMap((question) => question.options.map((option) => option.id)),
  );
  const rows: Array<{
    participantId: string;
    questionId: string;
    optionId?: string;
    value: string;
  }> = [];

  const questionsById = new Map(poll.questions.map((question) => [question.id, question]));
  const answersById = new Map(answers.map((answer) => [answer.questionId, answer]));

  for (const answer of answers) {
    if (!questionIds.has(answer.questionId)) {
      continue;
    }

    const question = questionsById.get(answer.questionId);
    const showIf = parseShowIf(question?.settingsJson);
    if (showIf) {
      const parent = answersById.get(showIf.questionId);
      const parentValue = parent?.type === "yes_no" ? parent.value : undefined;
      if (!isFollowUpVisible(showIf, parentValue)) {
        continue;
      }
    }

    if (answer.type === "availability") {
      for (const [optionId, value] of Object.entries(answer.selections)) {
        if (!optionIds.has(optionId) || !value) {
          continue;
        }
        rows.push({
          participantId,
          questionId: answer.questionId,
          optionId,
          value,
        });
      }
    }

    if (answer.type === "yes_no" && answer.value) {
      rows.push({
        participantId,
        questionId: answer.questionId,
        value: answer.value,
      });
    }

    if (answer.type === "multiple_choice" && answer.optionId && optionIds.has(answer.optionId)) {
      rows.push({
        participantId,
        questionId: answer.questionId,
        optionId: answer.optionId,
        value: answer.optionId,
      });
    }

    if (answer.type === "text" && answer.value.trim()) {
      rows.push({
        participantId,
        questionId: answer.questionId,
        value: answer.value.trim(),
      });
    }
  }

  return rows;
}
