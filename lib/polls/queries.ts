import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { participants, polls } from "@/db/schema";
import { secretLookupValues } from "@/lib/auth/tokens";

export async function getPollPublicMeta(publicId: string) {
  return db.query.polls.findFirst({
    where: eq(polls.publicId, publicId),
    columns: {
      title: true,
    },
  });
}

export async function getPollByPublicId(publicId: string) {
  return db.query.polls.findFirst({
    where: eq(polls.publicId, publicId),
    with: {
      questions: {
        orderBy: (questions, { asc }) => [asc(questions.sortOrder)],
        with: {
          options: {
            orderBy: (options, { asc }) => [asc(options.sortOrder)],
          },
          finalization: true,
        },
      },
      participants: {
        orderBy: (people, { asc }) => [asc(people.createdAt)],
        with: {
          responses: true,
        },
      },
    },
  });
}

export async function getPollsByOwnerUserId(ownerUserId: string) {
  return db.query.polls.findMany({
    where: eq(polls.ownerUserId, ownerUserId),
    orderBy: [desc(polls.createdAt)],
    columns: {
      publicId: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
    },
    with: {
      participants: {
        columns: { id: true },
      },
    },
  });
}

export async function getParticipantByEditToken(pollId: string, editToken: string) {
  return db.query.participants.findFirst({
    where: and(
      eq(participants.pollId, pollId),
      inArray(participants.editToken, secretLookupValues(editToken)),
    ),
    with: {
      responses: true,
    },
  });
}

export type PollWithDetails = NonNullable<Awaited<ReturnType<typeof getPollByPublicId>>>;
export type PollQuestion = PollWithDetails["questions"][number];
export type PollParticipant = PollWithDetails["participants"][number];
