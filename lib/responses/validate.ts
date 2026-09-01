import type { QuestionType } from "@/db/schema";
import { isFollowUpVisible, type ShowIfCondition } from "@/lib/polls/question-settings";

export type QuestionForValidation = {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  optionIds: string[];
  showIf?: ShowIfCondition | null;
};

export type AvailabilityAnswer = {
  type: "availability";
  questionId: string;
  selections: Record<string, "yes" | "maybe" | "no" | "">;
};

export type YesNoAnswer = {
  type: "yes_no";
  questionId: string;
  value: "yes" | "no" | "";
};

export type MultipleChoiceAnswer = {
  type: "multiple_choice";
  questionId: string;
  optionId: string;
};

export type TextAnswer = {
  type: "text";
  questionId: string;
  value: string;
};

export type QuestionAnswer =
  | AvailabilityAnswer
  | YesNoAnswer
  | MultipleChoiceAnswer
  | TextAnswer;

export function findMissingRequiredAnswers(
  questions: QuestionForValidation[],
  answers: QuestionAnswer[],
) {
  const answersByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  const missing: Array<{ questionId: string; title: string }> = [];

  for (const question of questions) {
    if (!question.required) {
      continue;
    }

    if (question.showIf) {
      const parent = answersByQuestion.get(question.showIf.questionId);
      const parentValue = parent?.type === "yes_no" ? parent.value : undefined;
      if (!isFollowUpVisible(question.showIf, parentValue)) {
        continue;
      }
    }

    const answer = answersByQuestion.get(question.id);
    if (!isAnswerComplete(question, answer)) {
      missing.push({ questionId: question.id, title: question.title });
    }
  }

  return missing;
}

export function isAnswerComplete(
  question: QuestionForValidation,
  answer: QuestionAnswer | undefined,
) {
  if (!answer || answer.type !== question.type) {
    return false;
  }

  switch (answer.type) {
    case "availability":
      return question.optionIds.some((optionId) => {
        const value = answer.selections[optionId];
        return value === "yes" || value === "maybe" || value === "no";
      });
    case "yes_no":
      return answer.value === "yes" || answer.value === "no";
    case "multiple_choice":
      return Boolean(answer.optionId && question.optionIds.includes(answer.optionId));
    case "text":
      return answer.value.trim().length > 0;
    default:
      return false;
  }
}

export function hasInvalidMaybeVotes(
  answers: QuestionAnswer[],
  allowMaybe: boolean,
) {
  if (allowMaybe) {
    return false;
  }

  return answers.some(
    (answer) =>
      answer.type === "availability" &&
      Object.values(answer.selections).includes("maybe"),
  );
}
