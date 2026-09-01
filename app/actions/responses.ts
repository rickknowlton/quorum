"use server";

import { cookies, headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { participants, responses } from "@/db/schema";
import {
  authCookieOptions,
  editCookieName,
  hashSecret,
  matchesStoredSecret,
  secretLookupValues,
} from "@/lib/auth/tokens";
import { createSecretToken } from "@/lib/ids";
import { isDatabaseUnavailable } from "@/lib/db/connection-error";
import { getPollByPublicId } from "@/lib/polls/queries";
import { parseAllowMultiple, parseShowIf } from "@/lib/polls/question-settings";
import { isAcceptingResponses, pollAcceptanceMessage } from "@/lib/polls/status";
import { clientIpFromHeaders, limitPollSubmission } from "@/lib/rate-limit";
import { buildResponseRows } from "@/lib/responses/build-rows";
import {
  findInvalidSingleChoiceAnswers,
  findMissingRequiredAnswers,
  hasInvalidMaybeVotes,
  type QuestionAnswer,
} from "@/lib/responses/validate";
import { resolveSubmitMode } from "@/lib/responses/submit-mode";
import { submitResponseSchema } from "@/lib/validation/poll";

function flattenZodError(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "Please check your answers and try again.";
}

export async function submitResponseAction(publicId: string, input: unknown) {
  const parsed = submitResponseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: flattenZodError(parsed.error) };
  }

  const limited = await limitPollSubmission(publicId, clientIpFromHeaders(await headers()));
  if (!limited.ok) {
    return { error: "Too many responses just now. Please wait a minute and try again." };
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
  const questionsForValidation = poll.questions.map((question) => ({
    id: question.id,
    type: question.type,
    title: question.title,
    required: question.required,
    optionIds: question.options.map((option) => option.id),
    allowMultiple: parseAllowMultiple(question.settingsJson),
    showIf: parseShowIf(question.settingsJson),
  }));
  const missing = findMissingRequiredAnswers(questionsForValidation, answers);

  if (missing.length > 0) {
    return { error: `Please answer: ${missing.map((item) => item.title).join(", ")}` };
  }

  const extraChoices = findInvalidSingleChoiceAnswers(questionsForValidation, answers);
  if (extraChoices.length > 0) {
    return {
      error: `Please choose only one option for: ${extraChoices.map((item) => item.title).join(", ")}`,
    };
  }

  if (hasInvalidMaybeVotes(answers, poll.allowMaybe)) {
    return { error: "This poll does not allow “If needed” responses." };
  }

  const cookieStore = await cookies();
  const formToken = parsed.data.editToken?.trim() || undefined;
  const cookieToken = cookieStore.get(editCookieName(publicId))?.value;
  const presentedToken = formToken ?? cookieToken;

  try {
    const editToken = await db.transaction(async (tx) => {
      const existing = presentedToken
        ? await tx.query.participants.findFirst({
            where: and(
              eq(participants.pollId, poll.id),
              inArray(participants.editToken, secretLookupValues(presentedToken)),
            ),
          })
        : undefined;
      const matches = Boolean(
        existing && presentedToken && matchesStoredSecret(presentedToken, existing.editToken),
      );
      const mode = resolveSubmitMode(formToken, matches);

      if (mode === "invalid-edit-link") {
        return { error: "This edit link is invalid." };
      }

      let participantId: string;
      let rawToken: string;

      if (mode === "edit" && existing && presentedToken) {
        if (!poll.allowResponseEditing) {
          return { error: "This poll does not allow editing responses." };
        }

        participantId = existing.id;
        rawToken = presentedToken;
        await tx
          .update(participants)
          .set({ name: parsed.data.name, updatedAt: new Date() })
          .where(eq(participants.id, participantId));
        await tx.delete(responses).where(eq(responses.participantId, participantId));
      } else {
        rawToken = createSecretToken();
        const [created] = await tx
          .insert(participants)
          .values({
            pollId: poll.id,
            name: parsed.data.name,
            editToken: hashSecret(rawToken),
          })
          .returning();

        if (!created) {
          throw new Error("Failed to create participant");
        }
        participantId = created.id;
      }

      const rows = buildResponseRows(poll, participantId, answers);
      if (rows.length > 0) {
        await tx.insert(responses).values(rows);
      }

      return rawToken;
    });

    if (typeof editToken === "object") {
      return editToken;
    }

    cookieStore.set(editCookieName(publicId), editToken, authCookieOptions(publicId));
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
