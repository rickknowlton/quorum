import type { QuestionType } from "@/db/schema";
import { isFollowUpVisible, type ShowIfCondition } from "@/lib/polls/question-settings";

export type QuestionForValidation = {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  optionIds: string[];
  allowMultiple?: boolean;
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
  optionIds: string[];
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
      return selectedChoiceIds(question, answer).length > 0;
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

export function findInvalidSingleChoiceAnswers(
  questions: QuestionForValidation[],
  answers: QuestionAnswer[],
) {
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const invalid: Array<{ questionId: string; title: string }> = [];

  for (const answer of answers) {
    if (answer.type !== "multiple_choice") {
      continue;
    }
    const question = questionsById.get(answer.questionId);
    if (!question || question.allowMultiple) {
      continue;
    }
    if (selectedChoiceIds(question, answer).length > 1) {
      invalid.push({ questionId: question.id, title: question.title });
    }
  }

  return invalid;
}

export function selectedChoiceIds(
  question: Pick<QuestionForValidation, "optionIds">,
  answer: MultipleChoiceAnswer,
) {
  const allowed = new Set(question.optionIds);
  const seen = new Set<string>();
  const selected: string[] = [];

  for (const optionId of answer.optionIds) {
    if (!allowed.has(optionId) || seen.has(optionId)) {
      continue;
    }
    seen.add(optionId);
    selected.push(optionId);
  }

  return selected;
}
