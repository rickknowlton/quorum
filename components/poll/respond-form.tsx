"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, X } from "lucide-react";
import { submitResponseAction } from "@/app/actions/responses";
import { AvailabilityRespondCalendar, AvailabilityListToggle } from "@/components/availability/availability-respond-calendar";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/fields";
import { Card } from "@/components/ui/shell";
import { cn } from "@/lib/cn";
import { formatDateHeading, formatTimeRange } from "@/lib/dates/format";
import { thanksPath } from "@/lib/polls/paths";
import { isFollowUpVisible, parseShowIf } from "@/lib/polls/question-settings";
import type { PollQuestion, PollWithDetails } from "@/lib/polls/queries";
import type { QuestionAnswer } from "@/lib/responses/validate";

type Props = {
  poll: PollWithDetails;
  editToken?: string;
  initialName?: string;
  initialAnswers?: QuestionAnswer[];
};

function emptyAnswers(questions: PollQuestion[]): QuestionAnswer[] {
  return questions.map((question) => {
    if (question.type === "availability") {
      return {
        type: "availability",
        questionId: question.id,
        selections: Object.fromEntries(question.options.map((option) => [option.id, ""])),
      };
    }
    if (question.type === "yes_no") {
      return { type: "yes_no", questionId: question.id, value: "" };
    }
    if (question.type === "multiple_choice") {
      return { type: "multiple_choice", questionId: question.id, optionId: "" };
    }
    return { type: "text", questionId: question.id, value: "" };
  });
}

export function RespondForm({ poll, editToken, initialName = "", initialAnswers }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [answers, setAnswers] = useState<QuestionAnswer[]>(
    initialAnswers ?? emptyAnswers(poll.questions),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const answersById = useMemo(
    () => new Map(answers.map((answer) => [answer.questionId, answer])),
    [answers],
  );

  function replaceAnswer(next: QuestionAnswer) {
    setAnswers((current) =>
      current.map((answer) => (answer.questionId === next.questionId ? next : answer)),
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await submitResponseAction(poll.publicId, {
      name,
      editToken,
      answers,
    });

    if ("error" in result && result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.push(thanksPath(poll.publicId));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <Label htmlFor="participant-name">Your name</Label>
        <Input
          id="participant-name"
          value={name}
          autoComplete="name"
          required
          placeholder="Rick"
          onChange={(event) => setName(event.target.value)}
        />
      </Card>

      {poll.questions.map((question) => {
        const answer = answersById.get(question.id);
        const showIf = parseShowIf(question.settingsJson);
        if (showIf) {
          const parent = answersById.get(showIf.questionId);
          const parentValue = parent?.type === "yes_no" ? parent.value : undefined;
          if (!isFollowUpVisible(showIf, parentValue)) {
            return null;
          }
        }
        const visibleIndex =
          poll.questions.filter((item) => {
            if (item.sortOrder > question.sortOrder) {
              return false;
            }
            const itemShowIf = parseShowIf(item.settingsJson);
            if (!itemShowIf) {
              return true;
            }
            const parent = answersById.get(itemShowIf.questionId);
            const parentValue = parent?.type === "yes_no" ? parent.value : undefined;
            return isFollowUpVisible(itemShowIf, parentValue);
          }).length;

        return (
          <Card key={question.id} className={showIf ? "border-accent/25" : ""}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {showIf ? "Follow-up" : `Question ${visibleIndex}`}
              {question.required ? "" : " · Optional"}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{question.title}</h2>
            {question.description ? (
              <p className="mt-1 text-sm text-muted">{question.description}</p>
            ) : null}

            <div className="mt-5">
              {question.type === "availability" && answer?.type === "availability" ? (
                <div className="space-y-5">
                  <AvailabilityRespondCalendar
                    question={question}
                    timezone={poll.timezone}
                    allowMaybe={poll.allowMaybe}
                    selections={answer.selections}
                    onChange={(optionId, value) =>
                      replaceAnswer({
                        ...answer,
                        selections: { ...answer.selections, [optionId]: value },
                      })
                    }
                  />
                  <AvailabilityListToggle count={question.options.length}>
                    <AvailabilityAnswers
                      question={question}
                      timezone={poll.timezone}
                      allowMaybe={poll.allowMaybe}
                      answer={answer}
                      onChange={replaceAnswer}
                    />
                  </AvailabilityListToggle>
                </div>
              ) : null}

              {question.type === "yes_no" && answer?.type === "yes_no" ? (
                <YesNoAnswers
                  question={question}
                  answer={answer}
                  onChange={replaceAnswer}
                />
              ) : null}

              {question.type === "multiple_choice" && answer?.type === "multiple_choice" ? (
                <ChoiceAnswers
                  question={question}
                  answer={answer}
                  onChange={replaceAnswer}
                />
              ) : null}

              {question.type === "text" && answer?.type === "text" ? (
                <>
                  <Label htmlFor={`text-${question.id}`} className="sr-only">
                    {question.title}
                  </Label>
                  <Textarea
                    id={`text-${question.id}`}
                    value={answer.value}
                    onChange={(event) =>
                      replaceAnswer({ ...answer, value: event.target.value })
                    }
                  />
                </>
              ) : null}
            </div>
          </Card>
        );
      })}

      {error ? <FieldError>{error}</FieldError> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : editToken ? "Save changes" : "Submit response"}
      </Button>
    </form>
  );
}

function AvailabilityAnswers({
  question,
  timezone,
  allowMaybe,
  answer,
  onChange,
}: {
  question: PollQuestion;
  timezone: string;
  allowMaybe: boolean;
  answer: Extract<QuestionAnswer, { type: "availability" }>;
  onChange: (answer: QuestionAnswer) => void;
}) {
  const grouped = groupOptionsByDate(question, timezone);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.heading}>
          <h3 className="mb-3 font-medium">{group.heading}</h3>
          <ul className="space-y-3">
            {group.options.map((option) => {
              if (!option.startsAt || !option.endsAt) {
                return null;
              }
              const value = answer.selections[option.id] ?? "";
              return (
                <li
                  key={option.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="font-medium">
                    {formatTimeRange(option.startsAt, option.endsAt, timezone)}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:flex">
                    <VoteButton
                      pressed={value === "yes"}
                      tone="yes"
                      onClick={() =>
                        onChange({
                          ...answer,
                          selections: { ...answer.selections, [option.id]: "yes" },
                        })
                      }
                    >
                      <Check className="size-4" aria-hidden="true" />
                      Yes
                    </VoteButton>
                    {allowMaybe ? (
                      <VoteButton
                        pressed={value === "maybe"}
                        tone="maybe"
                        onClick={() =>
                          onChange({
                            ...answer,
                            selections: { ...answer.selections, [option.id]: "maybe" },
                          })
                        }
                      >
                        <Minus className="size-4" aria-hidden="true" />
                        If needed
                      </VoteButton>
                    ) : null}
                    <VoteButton
                      pressed={value === "no"}
                      tone="no"
                      onClick={() =>
                        onChange({
                          ...answer,
                          selections: { ...answer.selections, [option.id]: "no" },
                        })
                      }
                    >
                      <X className="size-4" aria-hidden="true" />
                      Can&apos;t attend
                    </VoteButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function YesNoAnswers({
  question,
  answer,
  onChange,
}: {
  question: PollQuestion;
  answer: Extract<QuestionAnswer, { type: "yes_no" }>;
  onChange: (answer: QuestionAnswer) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={question.title}>
      <VoteButton
        pressed={answer.value === "yes"}
        tone="yes"
        onClick={() => onChange({ ...answer, value: "yes" })}
      >
        Yes
      </VoteButton>
      <VoteButton
        pressed={answer.value === "no"}
        tone="no"
        onClick={() => onChange({ ...answer, value: "no" })}
      >
        No
      </VoteButton>
    </div>
  );
}

function ChoiceAnswers({
  question,
  answer,
  onChange,
}: {
  question: PollQuestion;
  answer: Extract<QuestionAnswer, { type: "multiple_choice" }>;
  onChange: (answer: QuestionAnswer) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">{question.title}</legend>
      {question.options.map((option) => (
        <label
          key={option.id}
          className={cn(
            "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3",
            answer.optionId === option.id ? "border-accent bg-teal-50" : "border-border bg-white",
          )}
        >
          <input
            type="radio"
            name={question.id}
            className="size-4 accent-accent"
            checked={answer.optionId === option.id}
            onChange={() => onChange({ ...answer, optionId: option.id })}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

function VoteButton({
  pressed,
  tone,
  onClick,
  children,
}: {
  pressed: boolean;
  tone: "yes" | "maybe" | "no";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium",
        !pressed && "border-border bg-white text-foreground hover:bg-stone-50",
        pressed && tone === "yes" && "border-accent bg-teal-50 text-accent",
        pressed && tone === "maybe" && "border-amber-700 bg-amber-50 text-maybe",
        pressed && tone === "no" && "border-stone-400 bg-stone-100 text-no",
      )}
    >
      {children}
    </button>
  );
}

function groupOptionsByDate(question: PollQuestion, timezone: string) {
  const groups = new Map<string, PollQuestion["options"]>();
  for (const option of question.options) {
    if (!option.startsAt) {
      continue;
    }
    const heading = formatDateHeading(option.startsAt, timezone);
    const current = groups.get(heading) ?? [];
    current.push(option);
    groups.set(heading, current);
  }
  return [...groups.entries()].map(([heading, options]) => ({ heading, options }));
}
