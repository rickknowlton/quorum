import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { RespondForm } from "@/components/poll/respond-form";
import { Card, Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { editCookieName, tokensEqual } from "@/lib/auth/tokens";
import { getParticipantByEditToken, getPollByPublicId } from "@/lib/polls/queries";
import { isAcceptingResponses, pollAcceptanceMessage } from "@/lib/polls/status";
import { answersFromParticipant } from "@/lib/responses/hydrate";
import type { PollRouteProps } from "@/lib/polls/page-props";

type Props = PollRouteProps;

export const metadata: Metadata = {
  title: "Edit response",
};

export default async function EditResponsePage({ params, searchParams }: Props) {
  const { publicId } = await params;
  const query = await searchParams;
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = typeof query.token === "string" ? query.token : cookieStore.get(editCookieName(publicId))?.value;
  const participant = token ? await getParticipantByEditToken(poll.id, token) : undefined;
  const valid = participant && tokensEqual(token, participant.editToken);
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
        ) : (
          <div className="mt-8">
            <RespondForm
              poll={poll}
              editToken={participant.editToken}
              initialName={participant.name}
              initialAnswers={answersFromParticipant(poll.questions, {
                ...participant,
                responses: participant.responses,
              })}
            />
          </div>
        )}
      </Main>
    </PageShell>
  );
}
