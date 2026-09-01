import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PublicPollCredit } from "@/components/marketing/public-poll-credit";
import { RespondForm } from "@/components/poll/respond-form";
import { Card, Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { privatePageMetadata } from "@/lib/seo/metadata";
import { claimEditQueryToken } from "@/lib/auth/claim";
import { editCookieName, matchesStoredSecret } from "@/lib/auth/tokens";
import { getParticipantByEditToken, getPollByPublicId } from "@/lib/polls/queries";
import { isAcceptingResponses, pollAcceptanceMessage } from "@/lib/polls/status";
import { answersFromParticipant } from "@/lib/responses/hydrate";
import type { PollRouteProps } from "@/lib/polls/page-props";

type Props = PollRouteProps;

export const metadata: Metadata = privatePageMetadata("Edit response");

export default async function EditResponsePage({ params, searchParams }: Props) {
  const { publicId } = await params;
  const query = await searchParams;
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    notFound();
  }

  const queryToken = typeof query.token === "string" ? query.token : undefined;
  const cookieStore = await cookies();
  const token = queryToken ?? cookieStore.get(editCookieName(publicId))?.value;
  const participant = token ? await getParticipantByEditToken(poll.id, token) : undefined;
  const valid = Boolean(
    participant && token && matchesStoredSecret(token, participant.editToken),
  );

  await claimEditQueryToken({
    publicId,
    queryToken,
    storedToken: valid ? participant?.editToken : undefined,
  });
  const acceptance = isAcceptingResponses(poll);

  return (
    <PageShell>
      <SiteHeader />
      <Main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight">Edit your response</h1>
        <p className="mt-2 text-muted">{poll.title}</p>

        {!valid ? (
          <Card className="mt-8">
            <p>This edit link is invalid. Ask the organizer for the poll link and submit again.</p>
          </Card>
        ) : !poll.allowResponseEditing ? (
          <Card className="mt-8">
            <p>This poll does not allow editing responses.</p>
          </Card>
        ) : !acceptance.ok ? (
          <Card className="mt-8">
            <p>{pollAcceptanceMessage(acceptance.reason)}</p>
          </Card>
        ) : participant ? (
          <div className="mt-8">
            <RespondForm
              poll={poll}
              editToken={token}
              initialName={participant.name}
              initialAnswers={answersFromParticipant(poll.questions, {
                ...participant,
                responses: participant.responses,
              })}
            />
          </div>
        ) : (
          <Card className="mt-8">
            <p>This edit link is invalid. Ask the organizer for the poll link and submit again.</p>
          </Card>
        )}
        <PublicPollCredit />
      </Main>
    </PageShell>
  );
}
