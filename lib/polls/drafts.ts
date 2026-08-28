import type { DraftQuestion } from "@/components/questions/question-list";
import { sortGroups, type DateGroupDraft } from "@/lib/availability/slots";
import { formatWallDate, formatWallTime } from "@/lib/dates/format";
import {
  FOLLOW_UP_TITLE_DEFAULTS,
  followUpWhenFromValues,
  parseShowIf,
} from "@/lib/polls/question-settings";
import type { QuestionType } from "@/db/schema";

type DraftSourceOption = {
  id: string;
  label: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  sortOrder: number;
};

type DraftSourceQuestion = {
  id: string;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  sortOrder: number;
  settingsJson: Record<string, unknown> | null;
  options: DraftSourceOption[];
};

export function draftsFromPollQuestions(
  questions: DraftSourceQuestion[],
  timezone: string,
): DraftQuestion[] {
  const followUpByParent = new Map<string, DraftSourceQuestion>();
  for (const question of questions) {
    const showIf = parseShowIf(question.settingsJson);
    if (!showIf) {
      continue;
    }
    const current = followUpByParent.get(showIf.questionId);
    if (!current || question.sortOrder < current.sortOrder) {
      followUpByParent.set(showIf.questionId, question);
    }
  }

  const followUpIds = new Set(
    [...followUpByParent.values()].map((question) => question.id),
  );

  return [...questions]
    .filter((question) => !followUpIds.has(question.id))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((question) => {
      const followUp = followUpByParent.get(question.id);
      const showIf = followUp ? parseShowIf(followUp.settingsJson) : null;
      return {
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description ?? "",
        required: question.required,
        dates:
          question.type === "availability"
            ? datesFromOptions(question.options, timezone)
            : [],
        choices:
          question.type === "multiple_choice"
            ? [...question.options]
                .sort((left, right) => left.sortOrder - right.sortOrder)
                .map((option) => ({ id: option.id, label: option.label ?? "" }))
            : [],
        followUpEnabled: Boolean(followUp),
        followUpWhen: showIf ? followUpWhenFromValues(showIf.values) : "yes",
        followUpTitle: followUp?.title ?? FOLLOW_UP_TITLE_DEFAULTS.yes,
        followUpRequired: followUp?.required ?? false,
      };
    });
}

function datesFromOptions(options: DraftSourceOption[], timezone: string): DateGroupDraft[] {
  const groups: DateGroupDraft[] = [];
  const byDate = new Map<string, DateGroupDraft>();

  for (const option of [...options].sort((left, right) => left.sortOrder - right.sortOrder)) {
    if (!option.startsAt || !option.endsAt) {
      continue;
    }
    const date = formatWallDate(option.startsAt, timezone);
    const start = formatWallTime(option.startsAt, timezone);
    const end = formatWallTime(option.endsAt, timezone);
    const existing = byDate.get(date);
    if (existing) {
      existing.ranges.push({ id: option.id, start, end });
      continue;
    }
    const group = {
      id: option.id,
      date,
      ranges: [{ id: option.id, start, end }],
    };
    byDate.set(date, group);
    groups.push(group);
  }

  return sortGroups(groups);
}
