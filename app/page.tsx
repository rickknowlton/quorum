import { UseCaseCards } from "@/components/marketing/use-case-cards";
import { ProductDemo } from "@/components/marketing/product-demo";
import { QuestionTypes } from "@/components/marketing/question-types";
import { ResultsPreview } from "@/components/marketing/results-preview";
import { OriginStory } from "@/components/marketing/origin-story";
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
      <Main className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-24">
        <section className="max-w-2xl">
          <p className="font-serif text-5xl tracking-tight text-foreground sm:text-6xl">Quorum</p>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Make a decision with a group.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Find a time, take a vote, settle the details.
            <br />
            No account needed to respond. Create a poll, share one link, and see where the group
            agrees.
          </p>
          <div className="mt-8">
            <LinkButton href="/create">Create a poll</LinkButton>
          </div>
        </section>

        <div className="mt-20 space-y-20 sm:mt-28 sm:space-y-28">
          <UseCaseCards />
          <ProductDemo />
          <QuestionTypes />
          <ResultsPreview />
          <OriginStory />
        </div>
      </Main>
    </PageShell>
  );
}
