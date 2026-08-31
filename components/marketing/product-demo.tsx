import { Check, Minus, X } from "lucide-react";
import { Card } from "@/components/ui/shell";
import { SectionHeading } from "@/components/marketing/section-heading";

const times = [
  { label: "Mon 6 PM", votes: ["yes", "yes", "yes", "yes"] as const },
  { label: "Tue 7 PM", votes: ["yes", "yes", "maybe", "yes"] as const },
  { label: "Wed 6 PM", votes: ["yes", "no", "yes", "yes"] as const },
];

const budget = [
  { label: "Yes", count: 8, max: 8 },
  { label: "No", count: 4, max: 8 },
];

const places = [
  { label: "Beach", count: 6, max: 6 },
  { label: "Mountains", count: 4, max: 6 },
  { label: "City", count: 2, max: 6 },
];

export function ProductDemo() {
  return (
    <section>
      <SectionHeading support="Scheduling and voting live in the same poll.">
        One poll. All the questions.
      </SectionHeading>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold tracking-tight">When can everyone make it?</h3>
          <ul className="mt-5 divide-y divide-border">
            {times.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span className="font-medium">{row.label}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {row.votes.map((vote, index) => (
                    <VoteIcon key={`${row.label}-${index}`} vote={vote} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="grid gap-4">
          <Card>
            <h3 className="text-lg font-semibold tracking-tight">Should we increase the budget?</h3>
            <dl className="mt-5 space-y-3">
              {budget.map((row) => (
                <BarRow key={row.label} {...row} />
              ))}
            </dl>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold tracking-tight">Where should we go?</h3>
            <dl className="mt-5 space-y-3">
              {places.map((row) => (
                <BarRow key={row.label} {...row} />
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </section>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <dt className="font-medium">{label}</dt>
        <dd className="text-muted">{count}</dd>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max((count / max) * 100, 6)}%` }}
        />
      </div>
    </div>
  );
}

function VoteIcon({ vote }: { vote: "yes" | "maybe" | "no" }) {
  if (vote === "yes") {
    return (
      <span className="inline-flex text-yes" title="Yes">
        <Check className="size-4" aria-hidden="true" />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (vote === "maybe") {
    return (
      <span className="inline-flex text-maybe" title="If needed">
        <Minus className="size-4" aria-hidden="true" />
        <span className="sr-only">If needed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex text-no" title="Can't attend">
      <X className="size-4" aria-hidden="true" />
      <span className="sr-only">Can&apos;t attend</span>
    </span>
  );
}
