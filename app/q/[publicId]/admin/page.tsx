import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { privatePageMetadata } from "@/lib/seo/metadata";
import { AdminSettingsForm } from "@/components/poll/admin-settings-form";
import { ParticipantList } from "@/components/poll/participant-list";
import { ResultsList } from "@/components/results/results-list";
import { CopyButton } from "@/components/ui/copy-button";
import { LinkButton } from "@/components/ui/button";
import { Card, Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { ClaimQueryCookie } from "@/components/poll/claim-query-cookie";
import { SavePollToAccount } from "@/components/poll/save-poll-to-account";
import { getOrganizerAccess } from "@/lib/auth/access";
import { matchesStoredSecret } from "@/lib/auth/tokens";
import { timezoneLabel } from "@/lib/dates/format";
import { getPollByPublicId } from "@/lib/polls/queries";
import { buildPollResults } from "@/lib/results/build";
import { getAppOrigin } from "@/lib/polls/origin";
import { adminPath, adminQuestionsPath, participantPath } from "@/lib/polls/paths";
import type { PollRouteProps } from "@/lib/polls/page-props";

type Props = PollRouteProps;

export const metadata: Metadata = privatePageMetadata("Organizer dashboard");

export default async function AdminPage({ params, searchParams }: Props) {
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

  const origin = await getAppOrigin();
  const shareUrl = `${origin}${participantPath(publicId)}`;
  const results = buildPollResults(poll);

  return (
    <PageShell>
      <SiteHeader
        action={
          <LinkButton
            href={participantPath(publicId)}
            variant="ghost"
            size="sm"
            className="whitespace-nowrap"
          >
            View poll
          </LinkButton>
        }
      />
      <Main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        {queryToken && matchesStoredSecret(queryToken, poll.adminToken) ? (
          <ClaimQueryCookie
            publicId={publicId}
            token={queryToken}
            kind="admin"
            href={adminPath(publicId)}
          />
        ) : null}
        {poll.ownerUserId === null ? (
          <SavePollToAccount publicId={publicId} />
        ) : access.isOwner ? null : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            <p className="font-medium">This browser remembers organizer access.</p>
            <p className="mt-1">
              You opened this poll from a private link. Keep that original link if you need access
              on another device.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {poll.status === "open" ? "Open" : "Closed"} · {poll.participants.length}{" "}
              {poll.participants.length === 1 ? "response" : "responses"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{poll.title}</h1>
            {poll.description ? <p className="mt-2 text-muted">{poll.description}</p> : null}
            <p className="mt-2 text-sm text-muted">{timezoneLabel(poll.timezone)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={adminQuestionsPath(publicId)} variant="secondary" size="sm">
              Edit questions
            </LinkButton>
            <CopyButton value={shareUrl} label="Copy participant link" />
          </div>
        </div>

        <div className="mt-10">
          <ResultsList
            results={results}
            timezone={poll.timezone}
            showNames
            admin
            publicId={publicId}
            adminToken={undefined}
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <ParticipantList poll={poll} token={undefined} />
          <AdminSettingsForm poll={poll} token={undefined} />
        </div>
      </Main>
    </PageShell>
  );
}
