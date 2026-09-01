"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { polls, questionOptions, questions } from "@/db/schema";
import { wallTimeToUtc } from "@/lib/dates/format";
import { isDatabaseUnavailable } from "@/lib/db/connection-error";
import { createPublicId, createSecretToken } from "@/lib/ids";
import { hashSecret } from "@/lib/auth/tokens";
import { followUpValues } from "@/lib/polls/question-settings";
import { limitPollCreation } from "@/lib/rate-limit";
import { createPollSchema, type CreatePollInput } from "@/lib/validation/poll";

function flattenZodError(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export async function createPollAction(
  input: unknown,
): Promise<{ error: string } | { publicId: string }> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) {
    return { error: "Sign in to create a poll." };
  }

  const limited = await limitPollCreation(userId);
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

  try {
    const created = await db.transaction(async (tx) => {
      const [poll] = await tx
        .insert(polls)
        .values({
          publicId: createPublicId(),
          adminToken: hashSecret(createSecretToken()),
          ownerUserId: userId,
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

    revalidatePath("/dashboard");
    return {
      publicId: created.publicId,
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
