"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { polls, questionOptions, questions } from "@/db/schema";
import { wallTimeToUtc } from "@/lib/dates/format";
import { isDatabaseUnavailable } from "@/lib/db/connection-error";
import { createPublicId, createSecretToken } from "@/lib/ids";
import { adminCookieName, authCookieOptions, hashSecret, matchesStoredSecret } from "@/lib/auth/tokens";
import { followUpValues, multipleChoiceSettingsJson } from "@/lib/polls/question-settings";
import { getPollByPublicId } from "@/lib/polls/queries";
import { clientIpFromHeaders, limitPollCreation } from "@/lib/rate-limit";
import { isCreatedAnonymous } from "@/lib/polls/product-metrics";
import { createPollSchema, type CreatePollInput } from "@/lib/validation/poll";

function flattenZodError(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export async function createPollAction(
  input: unknown,
): Promise<{ error: string } | { publicId: string; adminToken: string }> {
  const { isAuthenticated, userId } = await auth();
  const ownerUserId = isAuthenticated && userId ? userId : null;

  const limited = await limitPollCreation(ownerUserId, clientIpFromHeaders(await headers()));
  if (!limited.ok) {
    return { error: "You’re creating polls too quickly. Please wait and try again." };
  }

  const parsed = createPollSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: flattenZodError(parsed.error),
    };
  }

  const data = parsed.data;
  const rawAdminToken = createSecretToken();

  try {
    const created = await db.transaction(async (tx) => {
      const [poll] = await tx
        .insert(polls)
        .values({
          publicId: createPublicId(),
          adminToken: hashSecret(rawAdminToken),
          ownerUserId,
          createdAnonymous: isCreatedAnonymous(ownerUserId),
          title: data.title,
          description: data.description || null,
          timezone: data.timezone,
          allowResponseEditing: data.allowResponseEditing,
          showParticipantNames: data.showParticipantNames,
          showResults: data.showResults,
          allowMaybe: data.allowMaybe,
        })
        .returning();

      if (!poll) {
        throw new Error("Failed to create poll");
      }

      let sortOrder = 0;
      for (const question of data.questions) {
        const [createdQuestion] = await tx
          .insert(questions)
          .values({
            pollId: poll.id,
            type: question.type,
            title: question.title,
            description: question.description || null,
            required: question.required,
            sortOrder: sortOrder,
            settingsJson:
              question.type === "multiple_choice"
                ? multipleChoiceSettingsJson(question.allowMultiple)
                : undefined,
          })
          .returning();

        sortOrder += 1;

        if (!createdQuestion) {
          throw new Error("Failed to create question");
        }

        if (question.type === "yes_no" && question.followUp) {
          await tx.insert(questions).values({
            pollId: poll.id,
            type: "text",
            title: question.followUp.title,
            required: question.followUp.required,
            sortOrder,
            settingsJson: {
              showIf: {
                questionId: createdQuestion.id,
                values: followUpValues(question.followUp.when),
              },
            },
          });
          sortOrder += 1;
        }

        if (question.type === "availability") {
          await tx.insert(questionOptions).values(
            question.ranges.map((range, rangeIndex) => ({
              questionId: createdQuestion.id,
              startsAt: wallTimeToUtc(range.date, range.start, data.timezone),
              endsAt: wallTimeToUtc(range.date, range.end, data.timezone),
              sortOrder: rangeIndex,
            })),
          );
        }

        if (question.type === "multiple_choice") {
          await tx.insert(questionOptions).values(
            question.options.map((option, optionIndex) => ({
              questionId: createdQuestion.id,
              label: option.label,
              sortOrder: optionIndex,
            })),
          );
        }
      }

      return poll;
    });

    const cookieStore = await cookies();
    cookieStore.set(
      adminCookieName(created.publicId),
      rawAdminToken,
      authCookieOptions(created.publicId),
    );
    if (ownerUserId) {
      revalidatePath("/dashboard");
    }
    return {
      publicId: created.publicId,
      adminToken: rawAdminToken,
    };
  } catch (error) {
    console.error(error);
    if (isDatabaseUnavailable(error)) {
      return {
        error: "Could not reach the database. Make sure PostgreSQL is running, then try again.",
      };
    }
    return { error: "Could not create the poll. Please try again." };
  }
}

export type CreatePollPayload = CreatePollInput;

export async function recordOrganizerLinkCopiedAction(publicId: string) {
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    return { ok: false as const };
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(adminCookieName(publicId))?.value;
  if (!matchesStoredSecret(cookieToken, poll.adminToken)) {
    return { ok: false as const };
  }

  try {
    await db
      .update(polls)
      .set({ organizerLinkCopiedAt: new Date() })
      .where(and(eq(polls.publicId, publicId), isNull(polls.organizerLinkCopiedAt)));
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}
