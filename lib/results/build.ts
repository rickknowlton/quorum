import {
  rankAvailabilityOptions,
  tallyAvailabilityVotes,
  type RankedAvailabilityOption,
} from "@/lib/availability/rank";
import type { PollParticipant, PollQuestion, PollWithDetails } from "@/lib/polls/queries";

export type ChoiceTally = {
  optionId: string;
  label: string;
  count: number;
  percentage: number;
};

export type YesNoTally = {
  yes: number;
  no: number;
  yesPercentage: number;
  noPercentage: number;
  total: number;
};

export type TextResponse = {
  participantId: string;
  name: string;
  value: string;
};

export type AvailabilityMatrixRow = {
  participantId: string;
  name: string;
  votes: Record<string, "yes" | "maybe" | "no" | "">;
};

export type AvailabilityResults = {
  type: "availability";
  question: PollQuestion;
  ranked: RankedAvailabilityOption[];
  matrix: AvailabilityMatrixRow[];
  participantCount: number;
};

export type YesNoResults = {
  type: "yes_no";
  question: PollQuestion;
  tally: YesNoTally;
};

export type MultipleChoiceResults = {
  type: "multiple_choice";
  question: PollQuestion;
  tallies: ChoiceTally[];
};

export type TextResults = {
  type: "text";
  question: PollQuestion;
  responses: TextResponse[];
};

export type QuestionResults =
  | AvailabilityResults
  | YesNoResults
  | MultipleChoiceResults
  | TextResults;

export function buildQuestionResults(
  question: PollQuestion,
  participants: PollParticipant[],
): QuestionResults {
  switch (question.type) {
    case "availability":
      return buildAvailabilityResults(question, participants);
    case "yes_no":
      return buildYesNoResults(question, participants);
    case "multiple_choice":
      return buildMultipleChoiceResults(question, participants);
    case "text":
      return buildTextResults(question, participants);
  }
}

export function buildPollResults(poll: PollWithDetails): QuestionResults[] {
  return poll.questions.map((question) =>
    buildQuestionResults(question, poll.participants),
  );
}

function buildAvailabilityResults(
  question: PollQuestion,
  participants: PollParticipant[],
): AvailabilityResults {
  const optionIds = question.options.map((option) => option.id);
  const votes = participants.flatMap((participant) =>
    participant.responses
      .filter((response) => response.questionId === question.id && response.optionId)
      .map((response) => ({
        optionId: response.optionId!,
        value: response.value,
      })),
  );

  return {
    type: "availability",
    question,
    ranked: rankAvailabilityOptions(
      tallyAvailabilityVotes(optionIds, votes),
      participants.length,
    ),
    matrix: participants.map((participant) => ({
      participantId: participant.id,
      name: participant.name,
      votes: Object.fromEntries(
        optionIds.map((optionId) => {
          const response = participant.responses.find(
            (item) => item.questionId === question.id && item.optionId === optionId,
          );
          const value = response?.value;
          return [
            optionId,
            value === "yes" || value === "maybe" || value === "no" ? value : "",
          ];
        }),
      ),
    })),
    participantCount: participants.length,
  };
}

function buildYesNoResults(
  question: PollQuestion,
  participants: PollParticipant[],
): YesNoResults {
  let yes = 0;
  let no = 0;

  for (const participant of participants) {
    const response = participant.responses.find((item) => item.questionId === question.id);
    if (response?.value === "yes") {
      yes += 1;
    } else if (response?.value === "no") {
      no += 1;
    }
  }

  const total = yes + no;
  return {
    type: "yes_no",
    question,
    tally: {
      yes,
      no,
      total,
      yesPercentage: total === 0 ? 0 : Math.round((yes / total) * 100),
      noPercentage: total === 0 ? 0 : Math.round((no / total) * 100),
    },
  };
}

function buildMultipleChoiceResults(
  question: PollQuestion,
  participants: PollParticipant[],
): MultipleChoiceResults {
  const counts = new Map(question.options.map((option) => [option.id, 0]));

  for (const participant of participants) {
    const response = participant.responses.find((item) => item.questionId === question.id);
    if (response?.optionId && counts.has(response.optionId)) {
      counts.set(response.optionId, (counts.get(response.optionId) ?? 0) + 1);
    }
  }

  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);

  return {
    type: "multiple_choice",
    question,
    tallies: question.options.map((option) => {
      const count = counts.get(option.id) ?? 0;
      return {
        optionId: option.id,
        label: option.label ?? "Untitled",
        count,
        percentage: total === 0 ? 0 : Math.round((count / total) * 100),
      };
    }),
  };
}

function buildTextResults(
  question: PollQuestion,
  participants: PollParticipant[],
): TextResults {
  return {
    type: "text",
    question,
    responses: participants.flatMap((participant) => {
      const response = participant.responses.find((item) => item.questionId === question.id);
      const value = response?.value.trim() ?? "";
      if (!value) {
        return [];
      }
      return [{ participantId: participant.id, name: participant.name, value }];
    }),
  };
}
