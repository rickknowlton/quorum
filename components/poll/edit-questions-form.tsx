"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, List, MessageSquarePlus, Plus } from "lucide-react";
import { updatePollQuestionsAction } from "@/app/actions/admin";
import {
  createDraftQuestion,
  QuestionList,
  serializeQuestions,
  type DraftQuestion,
} from "@/components/questions/question-list";
import { Button } from "@/components/ui/button";
import { FieldError, Hint } from "@/components/ui/fields";
import { Card } from "@/components/ui/shell";
import type { QuestionType } from "@/db/schema";

const ADD_TYPES: Array<{ type: QuestionType; label: string; icon: typeof CalendarClock }> = [
  { type: "availability", label: "Find a time", icon: CalendarClock },
  { type: "yes_no", label: "Yes / No", icon: Check },
  { type: "multiple_choice", label: "Multiple choice", icon: List },
  { type: "text", label: "Text", icon: MessageSquarePlus },
];

export function EditQuestionsForm({
  publicId,
  token,
  timezone,
  initialQuestions,
}: {
  publicId: string;
  token?: string;
  timezone: string;
  initialQuestions: DraftQuestion[];
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initialQuestions);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await updatePollQuestionsAction(publicId, token, {
      questions: serializeQuestions(questions),
    });

    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.refresh();
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Hint>
        Fix wording, add choices or times, or add a new question. Removing a time, choice, or
        question also removes any votes on it.
      </Hint>

      {questions.length === 0 ? (
        <Card className="border-dashed text-center">
          <p className="text-foreground">Add at least one question.</p>
        </Card>
      ) : (
        <QuestionList questions={questions} onChange={setQuestions} timezone={timezone} />
      )}

      <div className="flex flex-wrap gap-2">
        {ADD_TYPES.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            variant="secondary"
            onClick={() => setQuestions([...questions, createDraftQuestion(type)])}
          >
            <Plus className="size-4" aria-hidden="true" />
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Button>
        ))}
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving questions…" : "Save questions"}
      </Button>
    </form>
  );
}
