"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { AvailabilityBuilder } from "@/components/availability/availability-builder";
import { Button } from "@/components/ui/button";
import { Hint, Input, Label, Textarea } from "@/components/ui/fields";
import type { QuestionType } from "@/db/schema";
import {
  flattenRanges,
  type DateGroupDraft,
} from "@/lib/availability/slots";
import {
  FOLLOW_UP_TITLE_DEFAULTS,
  type FollowUpWhen,
} from "@/lib/polls/question-settings";

export type DraftChoice = { id: string; label: string };

export type DraftQuestion = {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  required: boolean;
  dates: DateGroupDraft[];
  choices: DraftChoice[];
  followUpEnabled: boolean;
  followUpWhen: FollowUpWhen;
  followUpTitle: string;
  followUpRequired: boolean;
  allowMultiple: boolean;
};

const TYPE_LABELS: Record<QuestionType, string> = {
  availability: "Availability",
  yes_no: "Yes / No",
  multiple_choice: "Multiple choice",
  text: "Text",
};

export function createDraftQuestion(type: QuestionType): DraftQuestion {
  return {
    id: crypto.randomUUID(),
    type,
    title:
      type === "availability"
        ? "When can you make it?"
        : type === "yes_no"
          ? ""
          : type === "multiple_choice"
            ? ""
            : "",
    description: "",
    required: type !== "text",
    dates: [],
    choices:
      type === "multiple_choice"
        ? [
            { id: crypto.randomUUID(), label: "" },
            { id: crypto.randomUUID(), label: "" },
          ]
        : [],
    followUpEnabled: false,
    followUpWhen: "yes",
    followUpTitle: FOLLOW_UP_TITLE_DEFAULTS.yes,
    followUpRequired: false,
    allowMultiple: false,
  };
}

export function serializeQuestions(questions: DraftQuestion[]) {
  return questions.map((question) => {
    const base = {
      id: question.id,
      type: question.type,
      title: question.title,
      description: question.description || undefined,
      required: question.required,
    };

    if (question.type === "availability") {
      return { ...base, type: "availability" as const, ranges: flattenRanges(question.dates) };
    }
    if (question.type === "multiple_choice") {
      return {
        ...base,
        type: "multiple_choice" as const,
        allowMultiple: question.allowMultiple,
        options: question.choices.map((choice) => ({ id: choice.id, label: choice.label })),
      };
    }
    if (question.type === "yes_no") {
      return {
        ...base,
        type: "yes_no" as const,
        followUp: question.followUpEnabled
          ? {
              when: question.followUpWhen,
              title: question.followUpTitle,
              required: question.followUpRequired,
            }
          : undefined,
      };
    }
    return { ...base, type: "text" as const };
  });
}

export function QuestionList({
  questions,
  onChange,
  timezone,
}: {
  questions: DraftQuestion[];
  onChange: (questions: DraftQuestion[]) => void;
  timezone: string;
}) {
  function update(id: string, patch: Partial<DraftQuestion>) {
    onChange(questions.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= questions.length) {
      return;
    }
    const copy = [...questions];
    const current = copy[index];
    const swap = copy[next];
    if (!current || !swap) {
      return;
    }
    copy[index] = swap;
    copy[next] = current;
    onChange(copy);
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <article key={question.id} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {index + 1}. {TYPE_LABELS[question.type]}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Move question up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Move question down"
                disabled={index === questions.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Delete question"
                onClick={() => onChange(questions.filter((item) => item.id !== question.id))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor={`title-${question.id}`}>Question</Label>
            <Input
              id={`title-${question.id}`}
              value={question.title}
              placeholder={
                question.type === "availability"
                  ? "When can you draft?"
                  : question.type === "yes_no"
                    ? "Should we increase league dues to $40?"
                    : question.type === "multiple_choice"
                      ? "Which scoring format should we use?"
                      : "Anything else we should discuss?"
              }
              onChange={(event) => update(question.id, { title: event.target.value })}
            />
          </div>

          <div className="mt-4">
            <Label htmlFor={`description-${question.id}`}>Description (optional)</Label>
            <Textarea
              id={`description-${question.id}`}
              className="min-h-20"
              value={question.description}
              onChange={(event) => update(question.id, { description: event.target.value })}
            />
          </div>

          {question.type === "availability" ? (
            <div className="mt-5">
              <p className="mb-3 text-sm font-medium">Add times</p>
              <AvailabilityBuilder
                groups={question.dates}
                onChange={(dates) => update(question.id, { dates })}
                timezone={timezone}
              />
            </div>
          ) : null}

          {question.type === "multiple_choice" ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium">Choices</p>
              {question.choices.map((choice, choiceIndex) => (
                <div key={choice.id} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`choice-${choice.id}`} className="sr-only">
                      Choice {choiceIndex + 1}
                    </Label>
                    <Input
                      id={`choice-${choice.id}`}
                      value={choice.label}
                      placeholder={choiceIndex === 0 ? "Full PPR" : "Half PPR"}
                      onChange={(event) =>
                        update(question.id, {
                          choices: question.choices.map((item) =>
                            item.id === choice.id ? { ...item, label: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </div>
                  {question.choices.length > 2 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove choice ${choiceIndex + 1}`}
                      onClick={() =>
                        update(question.id, {
                          choices: question.choices.filter((item) => item.id !== choice.id),
                        })
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  update(question.id, {
                    choices: [...question.choices, { id: crypto.randomUUID(), label: "" }],
                  })
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                Add choice
              </Button>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-accent"
                  checked={question.allowMultiple}
                  onChange={(event) =>
                    update(question.id, { allowMultiple: event.target.checked })
                  }
                />
                Allow selecting more than one
              </label>
              <Hint>
                {question.allowMultiple
                  ? "Participants can choose any number of options."
                  : "Participants choose one option."}
              </Hint>
            </div>
          ) : null}

          <label className="mt-5 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-accent"
              checked={question.required}
              onChange={(event) => update(question.id, { required: event.target.checked })}
            />
            Required
          </label>

          {question.type === "yes_no" ? (
            <FollowUpEditor
              question={question}
              onChange={(patch) => update(question.id, patch)}
            />
          ) : null}
        </article>
      ))}
    </div>
  );
}

function FollowUpEditor({
  question,
  onChange,
}: {
  question: DraftQuestion;
  onChange: (patch: Partial<DraftQuestion>) => void;
}) {
  function setWhen(when: FollowUpWhen) {
    const usingDefault = Object.values(FOLLOW_UP_TITLE_DEFAULTS).includes(question.followUpTitle);
    onChange({
      followUpWhen: when,
      followUpTitle: usingDefault ? FOLLOW_UP_TITLE_DEFAULTS[when] : question.followUpTitle,
    });
  }

  return (
    <div className="mt-5 rounded-lg border border-dashed border-border p-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-accent"
          checked={question.followUpEnabled}
          onChange={(event) => onChange({ followUpEnabled: event.target.checked })}
        />
        Ask a follow-up after Yes / No
      </label>
      {question.followUpEnabled ? (
        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium">Show follow-up when they answer</legend>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {(
                [
                  ["yes", "Yes"],
                  ["no", "No"],
                  ["either", "Yes or No"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    className="size-4 accent-accent"
                    name={`follow-up-when-${question.id}`}
                    checked={question.followUpWhen === value}
                    onChange={() => setWhen(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <Label htmlFor={`follow-up-${question.id}`}>Follow-up question</Label>
            <Input
              id={`follow-up-${question.id}`}
              value={question.followUpTitle}
              onChange={(event) => onChange({ followUpTitle: event.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-accent"
              checked={question.followUpRequired}
              onChange={(event) => onChange({ followUpRequired: event.target.checked })}
            />
            Follow-up is required
          </label>
          <Hint>This only appears if they pick the answer you chose above.</Hint>
        </div>
      ) : null}
    </div>
  );
}
