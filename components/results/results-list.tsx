"use client";

import { useState } from "react";
import { Check, ChevronDown, Minus, X } from "lucide-react";
import {
  addAvailabilityRangeAction,
  clearFinalizationAction,
  finalizeOptionAction,
} from "@/app/actions/admin";
import { AvailabilityResultsCalendar } from "@/components/availability/availability-results-calendar";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/fields";
import { Card } from "@/components/ui/shell";
import { formatFinalDate, formatOptionLabel, formatTimeRange } from "@/lib/dates/format";
import type { RankedAvailabilityOption } from "@/lib/availability/rank";
import { parseShowIf } from "@/lib/polls/question-settings";
import type { QuestionResults } from "@/lib/results/build";
import type { PollQuestion } from "@/lib/polls/queries";

const FEATURED_RANK_COUNT = 3;

function parentTitleFor(
  question: PollQuestion,
  results: QuestionResults[],
) {
  const showIf = parseShowIf(question.settingsJson);
  if (!showIf) {
    return undefined;
  }
  return results.find((item) => item.question.id === showIf.questionId)?.question.title;
}

export function ResultsList({
  results,
  timezone,
  showNames,
  admin,
  publicId,
  adminToken,
}: {
  results: QuestionResults[];
  timezone: string;
  showNames: boolean;
  admin?: boolean;
  publicId?: string;
  adminToken?: string;
}) {
  return (
    <div className="max-w-full min-w-0 space-y-8">
      {results.map((result) => {
        if (result.type === "availability") {
          return (
            <AvailabilityResultsCard
              key={result.question.id}
              result={result}
              timezone={timezone}
              showNames={showNames}
              admin={admin}
              publicId={publicId}
              adminToken={adminToken}
            />
          );
        }
        if (result.type === "yes_no") {
          return <YesNoResultsCard key={result.question.id} result={result} />;
        }
        if (result.type === "multiple_choice") {
          return <ChoiceResultsCard key={result.question.id} result={result} />;
        }
        return (
          <TextResultsCard
            key={result.question.id}
            result={result}
            showNames={showNames}
            parentTitle={parentTitleFor(result.question, results)}
          />
        );
      })}
    </div>
  );
}

function AvailabilityResultsCard({
  result,
  timezone,
  showNames,
  admin,
  publicId,
  adminToken,
}: {
  result: Extract<QuestionResults, { type: "availability" }>;
  timezone: string;
  showNames: boolean;
  admin?: boolean;
  publicId?: string;
  adminToken?: string;
}) {
  const optionById = new Map(result.question.options.map((option) => [option.id, option]));
  const finalizedId = result.question.finalization?.optionId;
  const finalized = finalizedId ? optionById.get(finalizedId) : undefined;

  return (
    <Card>
      <h2 className="text-xl font-semibold">{result.question.title}</h2>
      {result.question.description ? (
        <p className="mt-1 text-sm text-muted">{result.question.description}</p>
      ) : null}

      {finalized?.startsAt && finalized.endsAt ? (
        <div className="mt-5 rounded-lg border border-accent/30 bg-teal-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">Final date</p>
          <p className="mt-1 font-serif text-2xl text-foreground">
            {formatFinalDate(finalized.startsAt, finalized.endsAt, timezone).date}
          </p>
          <p className="text-foreground">
            {formatFinalDate(finalized.startsAt, finalized.endsAt, timezone).time}
          </p>
          {admin && publicId ? (
            <form
              action={clearFinalizationAction.bind(null, publicId, adminToken, result.question.id)}
              className="mt-3"
            >
              <Button type="submit" variant="ghost" size="sm">
                Undo final choice
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">
        Availability
      </h3>
      <div className="mt-3 min-w-0">
        <AvailabilityResultsCalendar
          question={result.question}
          ranked={result.ranked}
          participantCount={result.participantCount}
          timezone={timezone}
        />
      </div>

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        Best times
      </h3>
      {result.participantCount === 0 ? (
        <p className="mt-3 text-sm text-muted">No responses yet.</p>
      ) : (
        <RankedTimesDetails
          result={result}
          optionById={optionById}
          timezone={timezone}
          admin={admin}
          publicId={publicId}
          adminToken={adminToken}
          finalizedId={finalizedId}
        />
      )}

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted">
        Who can make it
      </h3>
      {result.participantCount === 0 ? (
        <p className="mt-3 text-sm text-muted">The grid will appear after the first response.</p>
      ) : (
        <Disclosure
          summary={
            <>
              {result.participantCount} {result.participantCount === 1 ? "person" : "people"} ·{" "}
              {result.question.options.length}{" "}
              {result.question.options.length === 1 ? "time" : "times"}
              <span className="ml-2 font-normal text-muted">View grid</span>
            </>
          }
        >
          <AvailabilityMatrix
            question={result.question}
            matrix={result.matrix}
            timezone={timezone}
            showNames={showNames}
          />
        </Disclosure>
      )}

      {admin && publicId ? (
        <form
          action={addAvailabilityRangeAction.bind(null, publicId, adminToken, result.question.id)}
          className="mt-6 rounded-lg border border-dashed border-border p-4"
        >
          <p className="text-sm font-medium">Add another candidate time</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor={`add-date-${result.question.id}`}>Date</Label>
              <Input id={`add-date-${result.question.id}`} name="date" type="date" required />
            </div>
            <div>
              <Label htmlFor={`add-start-${result.question.id}`}>Start</Label>
              <Input
                id={`add-start-${result.question.id}`}
                name="start"
                type="time"
                defaultValue="18:00"
                required
              />
            </div>
            <div>
              <Label htmlFor={`add-end-${result.question.id}`}>End</Label>
              <Input
                id={`add-end-${result.question.id}`}
                name="end"
                type="time"
                defaultValue="21:00"
                required
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Add time
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}

function RankedTimesDetails({
  result,
  optionById,
  timezone,
  admin,
  publicId,
  adminToken,
  finalizedId,
}: {
  result: Extract<QuestionResults, { type: "availability" }>;
  optionById: Map<string, PollQuestion["options"][number]>;
  timezone: string;
  admin?: boolean;
  publicId?: string;
  adminToken?: string;
  finalizedId?: string;
}) {
  const featured = result.ranked.slice(0, FEATURED_RANK_COUNT);
  const rest = result.ranked.slice(FEATURED_RANK_COUNT);

  return (
    <div className="mt-3 min-w-0 space-y-3">
      <ol className="space-y-3">
        {featured.map((item) => (
          <RankedTimeItem
            key={item.optionId}
            item={item}
            option={optionById.get(item.optionId)}
            timezone={timezone}
            admin={admin}
            publicId={publicId}
            adminToken={adminToken}
            questionId={result.question.id}
            finalizedId={finalizedId}
          />
        ))}
      </ol>
      {rest.length > 0 ? (
        <Disclosure
          summary={
            <>
              {rest.length} more {rest.length === 1 ? "time" : "times"}
              <span className="ml-2 font-normal text-muted">View ranking</span>
            </>
          }
        >
          <ol className="space-y-3">
            {rest.map((item) => (
              <RankedTimeItem
                key={item.optionId}
                item={item}
                option={optionById.get(item.optionId)}
                timezone={timezone}
                admin={admin}
                publicId={publicId}
                adminToken={adminToken}
                questionId={result.question.id}
                finalizedId={finalizedId}
              />
            ))}
          </ol>
        </Disclosure>
      ) : null}
    </div>
  );
}

function RankedTimeItem({
  item,
  option,
  timezone,
  admin,
  publicId,
  adminToken,
  questionId,
  finalizedId,
}: {
  item: RankedAvailabilityOption;
  option?: PollQuestion["options"][number];
  timezone: string;
  admin?: boolean;
  publicId?: string;
  adminToken?: string;
  questionId: string;
  finalizedId?: string;
}) {
  if (!option?.startsAt || !option.endsAt) {
    return null;
  }

  return (
    <li className="rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {item.rank}. {formatOptionLabel(option.startsAt, option.endsAt, timezone)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {item.yesCount} Yes · {item.maybeCount} Maybe · {item.noCount} No
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {item.unanimous ? <Badge>Unanimous</Badge> : null}
            {item.allButOneCanAttend ? <Badge>Everyone except one</Badge> : null}
            {item.highestYes ? <Badge>Most yes votes</Badge> : null}
          </div>
        </div>
        {admin && publicId && finalizedId !== item.optionId ? (
          <ConfirmAction
            label="Finalize"
            confirmLabel="Set as final date"
            description="This marks the winning time. It will not close the poll."
            variant="secondary"
            formAction={finalizeOptionAction.bind(
              null,
              publicId,
              adminToken,
              questionId,
              item.optionId,
            )}
          />
        ) : null}
      </div>
    </li>
  );
}

function AvailabilityMatrix({
  question,
  matrix,
  timezone,
  showNames,
}: {
  question: PollQuestion;
  matrix: Extract<QuestionResults, { type: "availability" }>["matrix"];
  timezone: string;
  showNames: boolean;
}) {
  if (matrix.length === 0) {
    return <p className="text-sm text-muted">The grid will appear after the first response.</p>;
  }

  return (
    <div className="max-w-full overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-stone-50 px-3 py-3 text-left font-medium">
              Participant
            </th>
            {question.options.map((option) => (
              <th
                key={option.id}
                className="min-w-24 bg-stone-50 px-3 py-3 text-center font-medium"
              >
                {option.startsAt && option.endsAt
                  ? formatTimeRange(option.startsAt, option.endsAt, timezone)
                  : option.label}
                <span className="mt-1 block text-xs font-normal text-muted">
                  {option.startsAt
                    ? formatOptionLabel(option.startsAt, option.endsAt ?? option.startsAt, timezone).split(",")[0]
                    : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.participantId} className="border-t border-border">
              <th className="sticky left-0 bg-surface px-3 py-3 text-left font-medium">
                {showNames ? row.name : "Participant"}
              </th>
              {question.options.map((option) => {
                const vote = row.votes[option.id] ?? "";
                return (
                  <td key={option.id} className="px-3 py-3 text-center">
                    <VoteMark vote={vote} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function VoteMark({ vote }: { vote: "yes" | "maybe" | "no" | "" }) {
  if (vote === "yes") {
    return (
      <span className="inline-flex items-center justify-center text-yes" title="Yes">
        <Check className="size-5" aria-hidden="true" />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (vote === "maybe") {
    return (
      <span className="inline-flex items-center justify-center text-maybe" title="If needed">
        <Minus className="size-5" aria-hidden="true" />
        <span className="sr-only">If needed</span>
      </span>
    );
  }
  if (vote === "no") {
    return (
      <span className="inline-flex items-center justify-center text-no" title="Can't attend">
        <X className="size-5" aria-hidden="true" />
        <span className="sr-only">Can&apos;t attend</span>
      </span>
    );
  }
  return <span className="text-muted">—</span>;
}

function YesNoResultsCard({
  result,
}: {
  result: Extract<QuestionResults, { type: "yes_no" }>;
}) {
  const max = Math.max(result.tally.yes, result.tally.no, 1);
  return (
    <Card>
      <h2 className="text-xl font-semibold">{result.question.title}</h2>
      {result.tally.total === 0 ? (
        <p className="mt-3 text-sm text-muted">No votes yet.</p>
      ) : (
        <dl className="mt-5 space-y-3">
          <CountRow label="Yes" count={result.tally.yes} percentage={result.tally.yesPercentage} max={max} />
          <CountRow label="No" count={result.tally.no} percentage={result.tally.noPercentage} max={max} />
        </dl>
      )}
    </Card>
  );
}

function ChoiceResultsCard({
  result,
}: {
  result: Extract<QuestionResults, { type: "multiple_choice" }>;
}) {
  const max = Math.max(...result.tallies.map((item) => item.count), 1);
  return (
    <Card>
      <h2 className="text-xl font-semibold">{result.question.title}</h2>
      <dl className="mt-5 space-y-3">
        {result.tallies.map((item) => (
          <CountRow
            key={item.optionId}
            label={item.label}
            count={item.count}
            percentage={item.percentage}
            max={max}
          />
        ))}
      </dl>
    </Card>
  );
}

function TextResultsCard({
  result,
  showNames,
  parentTitle,
}: {
  result: Extract<QuestionResults, { type: "text" }>;
  showNames: boolean;
  parentTitle?: string;
}) {
  return (
    <Card>
      {parentTitle ? (
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Follow-up · after {parentTitle}
        </p>
      ) : null}
      <h2 className={`text-xl font-semibold${parentTitle ? " mt-1" : ""}`}>{result.question.title}</h2>
      {result.responses.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No comments yet.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {result.responses.map((item) => (
            <li key={item.participantId} className="rounded-lg bg-stone-50 px-4 py-3">
              <p className="text-sm font-medium">{showNames ? item.name : "Participant"}</p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">{item.value}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CountRow({
  label,
  count,
  percentage,
  max,
}: {
  label: string;
  count: number;
  percentage: number;
  max: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <dt className="font-medium">{label}</dt>
        <dd className="text-muted">
          {count} · {percentage}%
        </dd>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max((count / max) * 100, count > 0 ? 6 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-foreground">
      {children}
    </span>
  );
}

function Disclosure({
  summary,
  children,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <details
      className="group mt-3 min-w-0 max-w-full rounded-lg border border-border bg-stone-50/80"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        <span>{summary}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted transition group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      {open ? <div className="min-w-0 max-w-full overflow-hidden border-t border-border p-4">{children}</div> : null}
    </details>
  );
}
