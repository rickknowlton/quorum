import type { QuestionType } from "@/db/schema";
import type { PollQuestion } from "@/lib/polls/queries";
import { isFollowUpVisible, parseShowIf } from "@/lib/polls/question-settings";
import type { QuestionAnswer } from "@/lib/responses/validate";

export type ResponseRow = {
  participantId: string;
  questionId: string;
  optionId?: string;
  value: string;
};

export type ResponseQuestion = {
  id: string;
  type: QuestionType;
  settingsJson?: Record<string, unknown> | null;
  options: Array<{ id: string }>;
};

export function optionBelongsToQuestion(
  question: { options: Array<{ id: string }> } | undefined,
  optionId: string,
) {
  return Boolean(question?.options.some((option) => option.id === optionId));
}

export function buildResponseRows(
  poll: { questions: ResponseQuestion[] },
  participantId: string,
  answers: QuestionAnswer[],
): ResponseRow[] {
  const questionsById = new Map(poll.questions.map((question) => [question.id, question]));
  const answersById = new Map(answers.map((answer) => [answer.questionId, answer]));
  const rows: ResponseRow[] = [];

  for (const answer of answers) {
    const question = questionsById.get(answer.questionId);
    if (!question || question.type !== answer.type) {
      continue;
    }

    const showIf = parseShowIf(question.settingsJson);
    if (showIf) {
      const parent = answersById.get(showIf.questionId);
      const parentValue = parent?.type === "yes_no" ? parent.value : undefined;
      if (!isFollowUpVisible(showIf, parentValue)) {
        continue;
      }
    }

    if (answer.type === "availability") {
      for (const [optionId, value] of Object.entries(answer.selections)) {
        if (!optionBelongsToQuestion(question, optionId) || !value) {
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

    if (
      answer.type === "multiple_choice" &&
      answer.optionId &&
      optionBelongsToQuestion(question, answer.optionId)
    ) {
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

export function canFinalizeAvailabilityOption(
  question: PollQuestion | undefined,
  optionId: string,
) {
  return Boolean(
    question && question.type === "availability" && optionBelongsToQuestion(question, optionId),
  );
}
