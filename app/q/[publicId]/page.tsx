import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { RespondForm } from "@/components/poll/respond-form";
import { LinkButton } from "@/components/ui/button";
import { Card, Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { editCookieName, tokensEqual } from "@/lib/auth/tokens";
import { timezoneLabel } from "@/lib/dates/format";
import { getPollByPublicId } from "@/lib/polls/queries";
import { isAcceptingResponses, pollAcceptanceMessage } from "@/lib/polls/status";
import { resultsPath } from "@/lib/polls/paths";
import { answersFromParticipant } from "@/lib/responses/hydrate";
import type { PollRouteProps } from "@/lib/polls/page-props";

type Props = PollRouteProps;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  const poll = await getPollByPublicId(publicId);
  return { title: poll?.title ?? "Poll" };
}

export default async function PollPage({ params }: Props) {
  const { publicId } = await params;
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    notFound();
  }

  const cookieStore = await cookies();
  const editToken = cookieStore.get(editCookieName(publicId))?.value;
  const participant = editToken
    ? poll.participants.find((item) => tokensEqual(editToken, item.editToken))
    : undefined;
  const acceptance = isAcceptingResponses(poll);

  return (
    <PageShell>
      <SiteHeader />
        <Main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Quorum poll</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{poll.title}</h1>
        {poll.description ? (
          <p className="mt-3 max-w-2xl text-lg text-muted">{poll.description}</p>
        ) : null}
        <p className="mt-3 text-sm text-muted">Times shown in {timezoneLabel(poll.timezone)}</p>

        {poll.showResults ? (
          <p className="mt-4">
            <LinkButton href={resultsPath(publicId)} variant="ghost" size="sm">
              View results
            </LinkButton>
          </p>
        ) : null}

        {!acceptance.ok ? (
          <Card className="mt-8">
            <p>{pollAcceptanceMessage(acceptance.reason)}</p>
            {poll.showResults ? (
              <p className="mt-3">
                <LinkButton href={resultsPath(publicId)} size="sm">
                  See the results
                </LinkButton>
              </p>
            ) : null}
          </Card>
        ) : (
          <div className="mt-8">
            {participant ? (
              <p className="mb-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
                You already responded as <strong>{participant.name}</strong>. You can update your
                answers below.
              </p>
            ) : null}
            <RespondForm
              poll={poll}
              editToken={participant?.editToken}
              initialName={participant?.name}
              initialAnswers={
                participant ? answersFromParticipant(poll.questions, participant) : undefined
              }
            />
          </div>
        )}
      </Main>
    </PageShell>
  );
}
