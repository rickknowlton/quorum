import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/ui/button";
import { Card, Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { privatePageMetadata } from "@/lib/seo/metadata";
import { editCookieName, tokensEqual } from "@/lib/auth/tokens";
import { getPollByPublicId } from "@/lib/polls/queries";
import { editPath, participantPath, resultsPath } from "@/lib/polls/paths";
import { getAppOrigin } from "@/lib/polls/origin";
import type { PollRouteProps } from "@/lib/polls/page-props";

type Props = PollRouteProps;

export const metadata: Metadata = privatePageMetadata("Response saved");

export default async function ThanksPage({ params }: Props) {
  const { publicId } = await params;
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(editCookieName(publicId))?.value;
  const participant = token
    ? poll.participants.find((item) => tokensEqual(token, item.editToken))
    : undefined;
  const origin = await getAppOrigin();
  const editUrl = participant ? `${origin}${editPath(publicId, participant.editToken)}` : null;

  return (
    <PageShell>
      <SiteHeader />
      <Main>
        <Card>
          <h1 className="text-2xl font-semibold tracking-tight">Your response has been saved.</h1>
          <p className="mt-2 text-muted">Thanks for helping the group decide on {poll.title}.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {participant && poll.allowResponseEditing ? (
              <LinkButton href={editPath(publicId, participant.editToken)} variant="secondary">
                Edit my response
              </LinkButton>
            ) : null}
            <LinkButton href={participantPath(publicId)} variant="ghost">
              Back to poll
            </LinkButton>
            {poll.showResults ? (
              <LinkButton href={resultsPath(publicId)} variant="ghost">
                View results
              </LinkButton>
            ) : null}
          </div>

          {editUrl && poll.allowResponseEditing ? (
            <p className="mt-6 text-sm text-muted">
              Bookmark this page or save your personal edit link so you can change your answers later:
              <br />
              <span className="mt-2 inline-block break-all text-foreground">{editUrl}</span>
            </p>
          ) : null}

          <p className="mt-8 border-t border-border pt-6 text-sm text-muted">
            Need to organize your own group?{" "}
            <Link href="/create" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create a Quorum
            </Link>
          </p>
        </Card>
      </Main>
    </PageShell>
  );
}
