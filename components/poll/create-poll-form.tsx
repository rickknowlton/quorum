"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CalendarClock, Check, List, MessageSquarePlus, Plus } from "lucide-react";
import { createPollAction, recordOrganizerLinkCopiedAction } from "@/app/actions/polls";
import { productEvent, trackProduct } from "@/lib/analytics/product";
import {
  createDraftQuestion,
  QuestionList,
  serializeQuestions,
  type DraftQuestion,
} from "@/components/questions/question-list";
import { Button, LinkButton } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { FieldError, Hint, Input, Label, Textarea } from "@/components/ui/fields";
import { Card } from "@/components/ui/shell";
import { adminPath, participantPath } from "@/lib/polls/paths";
import type { QuestionType } from "@/db/schema";

const ADD_TYPES: Array<{ type: QuestionType; label: string; icon: typeof CalendarClock }> = [
  { type: "availability", label: "Find a time", icon: CalendarClock },
  { type: "yes_no", label: "Yes / No", icon: Check },
  { type: "multiple_choice", label: "Multiple choice", icon: List },
  { type: "text", label: "Text", icon: MessageSquarePlus },
];

export function CreatePollForm() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [allowResponseEditing, setAllowResponseEditing] = useState(true);
  const [showParticipantNames, setShowParticipantNames] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [allowMaybe, setAllowMaybe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<{ publicId: string; adminToken: string } | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createPollAction({
      title,
      description: description || undefined,
      timezone,
      allowResponseEditing,
      showParticipantNames,
      showResults,
      allowMaybe,
      questions: serializeQuestions(questions),
    });

    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (isSignedIn) {
      router.push(adminPath(result.publicId));
      return;
    }

    setCreated({ publicId: result.publicId, adminToken: result.adminToken });
    trackProduct(productEvent.pollCreatedAnonymous);
    setPending(false);
  }

  if (created) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const participantUrl = `${origin}${participantPath(created.publicId)}`;
    const organizerUrl = `${origin}${adminPath(created.publicId, created.adminToken)}`;

    return (
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Poll created</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">No account required</h2>
        <p className="mt-2 text-muted">
          Save this private organizer link if you want to manage the poll from another device.
          Anyone with that link can manage the poll.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <CopyButton value={participantUrl} label="Copy participant link" />
          <CopyButton
            value={organizerUrl}
            label="Copy private organizer link"
            onCopied={() => {
              trackProduct(productEvent.copiedOrganizerLink);
              void recordOrganizerLinkCopiedAction(created.publicId);
            }}
          />
          <LinkButton href={adminPath(created.publicId)} size="sm">
            Open poll admin
          </LinkButton>
        </div>
        <p className="mt-4 text-sm text-muted">
          Prefer not to keep track of a link? Save this poll to an account from the admin page.
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Card>
        <div>
          <Label htmlFor="title">Poll title</Label>
          <Input
            id="title"
            value={title}
            placeholder="Booze League Draft"
            required
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="mt-4">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            placeholder="Let’s figure this thing out."
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <Hint>Times will be shown in {timezone}.</Hint>
      </Card>

      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Questions</h2>
          <p className="mt-1 text-sm text-muted">
            Mix scheduling with yes/no, multiple choice, and open questions.
          </p>
        </div>

        {questions.length === 0 ? (
          <Card className="border-dashed text-center">
            <p className="text-foreground">Add your first question.</p>
            <p className="mt-1 text-sm text-muted">A poll needs at least one.</p>
          </Card>
        ) : (
          <QuestionList questions={questions} onChange={setQuestions} timezone={timezone} />
        )}

        <div className="mt-4 flex flex-wrap gap-2">
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
      </div>

      <Card>
        <h2 className="text-lg font-semibold">Settings</h2>
        <div className="mt-4 space-y-3">
          <Toggle
            checked={allowResponseEditing}
            onChange={setAllowResponseEditing}
            label="Allow participants to edit responses"
          />
          <Toggle
            checked={showParticipantNames}
            onChange={setShowParticipantNames}
            label="Show participant names to others"
          />
          <Toggle
            checked={showResults}
            onChange={setShowResults}
            label="Show results to participants"
          />
          <Toggle
            checked={allowMaybe}
            onChange={setAllowMaybe}
            label="Allow “If needed” on availability questions"
          />
        </div>
      </Card>

      {error ? <FieldError>{error}</FieldError> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating poll…" : "Create poll"}
      </Button>
    </form>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 size-4 accent-accent"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
