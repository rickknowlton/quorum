import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, client } from "./index";
import {
  participants,
  polls,
  questionOptions,
  questions,
  responses,
} from "./schema";
import { createSecretToken } from "../lib/ids";
import { hashSecret } from "../lib/auth/tokens";
import { wallTimeToUtc } from "../lib/dates/format";

export const DEMO_PUBLIC_ID = "demoBooze01";
export const DEMO_ADMIN_TOKEN = "devAdminBoozeLeagueDraftTokenLocalOnly0001";
const TIMEZONE = "America/New_York";

const NAMES = ["Rick", "Kyle", "Andrew", "Mike", "Josh", "Tyler", "Chris", "Dan"] as const;

type Vote = "yes" | "maybe" | "no";

async function seed() {
  await db.delete(polls).where(eq(polls.publicId, DEMO_PUBLIC_ID));

  const [poll] = await db
    .insert(polls)
    .values({
      publicId: DEMO_PUBLIC_ID,
      adminToken: hashSecret(DEMO_ADMIN_TOKEN),
      createdAnonymous: false,
      title: "Booze League Draft",
      description: "Let's lock in the draft and a few league rules before the season.",
      timezone: TIMEZONE,
      allowResponseEditing: true,
      showParticipantNames: true,
      showResults: false,
      allowMaybe: true,
    })
    .returning();

  if (!poll) {
    throw new Error("Failed to insert demo poll");
  }

  const [availability] = await db
    .insert(questions)
    .values({
      pollId: poll.id,
      type: "availability",
      title: "When can you draft?",
      description: "Evenings only. Pick Yes, If needed, or Can't attend for each time.",
      required: true,
      sortOrder: 0,
    })
    .returning();

  const [dues] = await db
    .insert(questions)
    .values({
      pollId: poll.id,
      type: "yes_no",
      title: "Should we increase league dues to $40 this year?",
      required: true,
      sortOrder: 1,
    })
    .returning();

  const [duesWhy] = await db
    .insert(questions)
    .values({
      pollId: poll.id,
      type: "text",
      title: "You said “Yes” on the previous question. Can you elaborate?",
      required: false,
      sortOrder: 2,
      settingsJson: {
        showIf: { questionId: dues.id, values: ["yes"] },
      },
    })
    .returning();

  const [format] = await db
    .insert(questions)
    .values({
      pollId: poll.id,
      type: "multiple_choice",
      title: "Which scoring format should we use?",
      required: true,
      sortOrder: 3,
    })
    .returning();

  const [notes] = await db
    .insert(questions)
    .values({
      pollId: poll.id,
      type: "text",
      title: "Anything else we need to settle before the season?",
      required: false,
      sortOrder: 4,
    })
    .returning();

  if (!availability || !dues || !duesWhy || !format || !notes) {
    throw new Error("Failed to insert demo questions");
  }

  const slots = [
    { date: "2026-08-26", start: "19:00", end: "22:00" },
    { date: "2026-08-27", start: "19:00", end: "22:00" },
    { date: "2026-08-30", start: "15:00", end: "18:00" },
    { date: "2026-08-30", start: "18:00", end: "21:00" },
    { date: "2026-08-31", start: "18:00", end: "21:00" },
  ];

  const availabilityOptions = await db
    .insert(questionOptions)
    .values(
      slots.map((slot, index) => ({
        questionId: availability.id,
        startsAt: wallTimeToUtc(slot.date, slot.start, TIMEZONE),
        endsAt: wallTimeToUtc(slot.date, slot.end, TIMEZONE),
        sortOrder: index,
      })),
    )
    .returning();

  const formatOptions = await db
    .insert(questionOptions)
    .values([
      { questionId: format.id, label: "Full PPR", sortOrder: 0 },
      { questionId: format.id, label: "Half PPR", sortOrder: 1 },
      { questionId: format.id, label: "Standard", sortOrder: 2 },
    ])
    .returning();

  const [wed, thu, sunAfternoon, sunEvening, mon] = availabilityOptions;
  const [fullPpr, halfPpr, standard] = formatOptions;
  if (!wed || !thu || !sunAfternoon || !sunEvening || !mon || !fullPpr || !halfPpr || !standard) {
    throw new Error("Failed to insert demo options");
  }

  const people = await db
    .insert(participants)
    .values(NAMES.map((name) => ({ pollId: poll.id, name, editToken: hashSecret(createSecretToken()) })))
    .returning();

  const byName = Object.fromEntries(people.map((person) => [person.name, person]));

  const availabilityVotes: Record<(typeof NAMES)[number], [Vote, Vote, Vote, Vote, Vote]> = {
    Rick: ["yes", "yes", "no", "yes", "maybe"],
    Kyle: ["yes", "yes", "yes", "yes", "no"],
    Andrew: ["yes", "maybe", "yes", "yes", "yes"],
    Mike: ["yes", "yes", "no", "no", "no"],
    Josh: ["yes", "yes", "yes", "maybe", "yes"],
    Tyler: ["yes", "yes", "no", "yes", "no"],
    Chris: ["maybe", "yes", "yes", "no", "maybe"],
    Dan: ["yes", "no", "yes", "yes", "yes"],
  };

  const duesVotes: Record<(typeof NAMES)[number], "yes" | "no"> = {
    Rick: "yes",
    Kyle: "yes",
    Andrew: "no",
    Mike: "yes",
    Josh: "no",
    Tyler: "yes",
    Chris: "yes",
    Dan: "no",
  };

  const formatVotes: Record<(typeof NAMES)[number], string> = {
    Rick: fullPpr.id,
    Kyle: fullPpr.id,
    Andrew: halfPpr.id,
    Mike: halfPpr.id,
    Josh: halfPpr.id,
    Tyler: fullPpr.id,
    Chris: fullPpr.id,
    Dan: standard.id,
  };

  const duesWhyVotes: Partial<Record<(typeof NAMES)[number], string>> = {
    Rick: "Forty keeps the pot interesting without getting ridiculous.",
    Kyle: "I'm in if everyone else is.",
    Tyler: "Inflation is real and the trophies aren't getting cheaper.",
  };

  const notesVotes: Partial<Record<(typeof NAMES)[number], string>> = {
    Rick: "Can we keep the same buy-in pot rules as last year?",
    Kyle: "If Wednesday works I'm hosting.",
    Dan: "Please no extra keepers this season.",
  };

  const responseRows: Array<{
    participantId: string;
    questionId: string;
    optionId?: string;
    value: string;
  }> = [];

  for (const name of NAMES) {
    const person = byName[name];
    if (!person) {
      continue;
    }
    const [w, t, s3, s6, m] = availabilityVotes[name];
    responseRows.push(
      { participantId: person.id, questionId: availability.id, optionId: wed.id, value: w },
      { participantId: person.id, questionId: availability.id, optionId: thu.id, value: t },
      { participantId: person.id, questionId: availability.id, optionId: sunAfternoon.id, value: s3 },
      { participantId: person.id, questionId: availability.id, optionId: sunEvening.id, value: s6 },
      { participantId: person.id, questionId: availability.id, optionId: mon.id, value: m },
      { participantId: person.id, questionId: dues.id, value: duesVotes[name] },
      {
        participantId: person.id,
        questionId: format.id,
        optionId: formatVotes[name],
        value: formatVotes[name],
      },
    );
    if (duesWhyVotes[name]) {
      responseRows.push({
        participantId: person.id,
        questionId: duesWhy.id,
        value: duesWhyVotes[name],
      });
    }
    if (notesVotes[name]) {
      responseRows.push({
        participantId: person.id,
        questionId: notes.id,
        value: notesVotes[name],
      });
    }
  }

  await db.insert(responses).values(responseRows);

  console.log("Seeded Booze League Draft demo poll");
  console.log(`Participant: http://localhost:3000/q/${DEMO_PUBLIC_ID}`);
  console.log(
    `Admin:        http://localhost:3000/q/${DEMO_PUBLIC_ID}/admin?token=${DEMO_ADMIN_TOKEN}`,
  );
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
