import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultsList } from "@/components/results/results-list";
import { Card, Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { LinkButton } from "@/components/ui/button";
import { getPollByPublicId } from "@/lib/polls/queries";
import { participantPath } from "@/lib/polls/paths";
import { buildPollResults } from "@/lib/results/build";
import type { PollRouteProps } from "@/lib/polls/page-props";

type Props = PollRouteProps;

export const metadata: Metadata = {
  title: "Results",
};

export default async function ResultsPage({ params }: Props) {
  const { publicId } = await params;
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    notFound();
  }

  if (!poll.showResults) {
    return (
      <PageShell>
        <SiteHeader />
        <Main>
          <Card>
            <h1 className="text-2xl font-semibold">Results are hidden</h1>
            <p className="mt-2 text-muted">
              The organizer has not made results visible to participants.
            </p>
            <div className="mt-4">
              <LinkButton href={participantPath(publicId)} variant="secondary" size="sm">
                Back to poll
              </LinkButton>
            </div>
          </Card>
        </Main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SiteHeader />
      <Main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight">{poll.title}</h1>
        <p className="mt-2 text-muted">Results</p>
        <div className="mt-8">
          <ResultsList
            results={buildPollResults(poll)}
            timezone={poll.timezone}
            showNames={poll.showParticipantNames}
          />
        </div>
      </Main>
    </PageShell>
  );
}
