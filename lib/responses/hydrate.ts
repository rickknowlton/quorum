import type { PollQuestion } from "@/lib/polls/queries";
import type { QuestionAnswer } from "@/lib/responses/validate";

export function answersFromParticipant(
  questions: PollQuestion[],
  participant: { responses: Array<{ questionId: string; optionId: string | null; value: string }> },
): QuestionAnswer[] {
  return questions.map((question) => {
    const questionResponses = participant.responses.filter(
      (response) => response.questionId === question.id,
    );

    if (question.type === "availability") {
      return {
        type: "availability",
        questionId: question.id,
        selections: Object.fromEntries(
          question.options.map((option) => {
            const response = questionResponses.find((item) => item.optionId === option.id);
            const value = response?.value;
            return [
              option.id,
              value === "yes" || value === "maybe" || value === "no" ? value : "",
            ];
          }),
        ),
      };
    }

    if (question.type === "yes_no") {
      const value = questionResponses[0]?.value;
      return {
        type: "yes_no",
        questionId: question.id,
        value: value === "yes" || value === "no" ? value : "",
      };
    }

    if (question.type === "multiple_choice") {
      return {
        type: "multiple_choice",
        questionId: question.id,
        optionId: questionResponses[0]?.optionId ?? "",
      };
    }

    return {
      type: "text",
      questionId: question.id,
      value: questionResponses[0]?.value ?? "",
    };
  });
}
