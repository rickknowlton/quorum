import { Check } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Main, PageShell, SiteHeader } from "@/components/ui/shell";

export default function HomePage() {
  return (
    <PageShell>
      <SiteHeader
        action={
          <LinkButton
            href="/create"
            variant="ghost"
            size="sm"
            className="whitespace-nowrap"
            aria-label="Create a poll"
          >
            <span className="sm:hidden" aria-hidden="true">
              Create
            </span>
            <span className="max-sm:hidden">Create a poll</span>
          </LinkButton>
        }
      />
      <Main className="mx-auto w-full max-w-4xl px-4 py-16 sm:py-24">
        <section className="max-w-2xl">
          <p className="font-serif text-5xl tracking-tight text-foreground sm:text-6xl">Quorum</p>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Make a decision with a group.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Find a time, take a vote, settle the details.
            <br />
            Participants don’t need an account. Organizers sign in so every poll lives in one place.
          </p>
          <div className="mt-8">
            <LinkButton href="/create">Create a poll</LinkButton>
          </div>
        </section>

        <section className="mt-20 max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Example</p>
          <h2 className="mt-2 text-xl font-semibold">Fantasy Football Draft</h2>
          <ul className="mt-4 space-y-3 text-foreground">
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 size-5 text-accent" aria-hidden="true" />
              When can everyone draft?
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 size-5 text-accent" aria-hidden="true" />
              Increase dues to $40?
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 size-5 text-accent" aria-hidden="true" />
              PPR or half-PPR?
            </li>
          </ul>
        </section>
      </Main>
    </PageShell>
  );
}
