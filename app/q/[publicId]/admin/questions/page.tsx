import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { privatePageMetadata } from "@/lib/seo/metadata";
import { EditQuestionsForm } from "@/components/poll/edit-questions-form";
import { LinkButton } from "@/components/ui/button";
import { Card, Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { ClaimQueryCookie } from "@/components/poll/claim-query-cookie";
import { getOrganizerAccess } from "@/lib/auth/access";
import { matchesStoredSecret } from "@/lib/auth/tokens";
import { draftsFromPollQuestions } from "@/lib/polls/drafts";
import { adminPath, adminQuestionsPath } from "@/lib/polls/paths";
import { getPollByPublicId } from "@/lib/polls/queries";
import type { PollRouteProps } from "@/lib/polls/page-props";

type Props = PollRouteProps;

export const metadata: Metadata = privatePageMetadata("Edit questions");

export default async function AdminQuestionsPage({ params, searchParams }: Props) {
  const { publicId } = await params;
  const query = await searchParams;
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    notFound();
  }

  const queryToken = typeof query.token === "string" ? query.token : undefined;
  const access = await getOrganizerAccess(poll, queryToken);

  if (!access.authorized) {
    return (
      <PageShell>
        <SiteHeader />
        <Main>
          <Card>
            <h1 className="text-2xl font-semibold">Admin access required</h1>
            <p className="mt-2 text-muted">
              Sign in with the organizer account, or use the private organizer link for this poll.
            </p>
          </Card>
        </Main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SiteHeader
        action={
          <LinkButton
            href={adminPath(publicId)}
            variant="ghost"
            size="sm"
            className="whitespace-nowrap"
          >
            Back to poll
          </LinkButton>
        }
      />
      <Main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        {queryToken && matchesStoredSecret(queryToken, poll.adminToken) ? (
          <ClaimQueryCookie
            publicId={publicId}
            token={queryToken}
            kind="admin"
            href={adminQuestionsPath(publicId)}
          />
        ) : null}
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Organizer</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit questions</h1>
        <p className="mt-2 text-muted">{poll.title}</p>
        <div className="mt-8">
          <EditQuestionsForm
            key={poll.questions.map((question) => `${question.id}:${question.updatedAt}`).join("|")}
            publicId={publicId}
            token={undefined}
            timezone={poll.timezone}
            initialQuestions={draftsFromPollQuestions(poll.questions, poll.timezone)}
          />
        </div>
      </Main>
    </PageShell>
  );
}
