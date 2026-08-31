import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { LinkButton } from "@/components/ui/button";
import { Card, Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { getPollsByOwnerUserId } from "@/lib/polls/queries";
import { adminPath } from "@/lib/polls/paths";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My polls",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const polls = await getPollsByOwnerUserId(userId);

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
      <Main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Organizer</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">My polls</h1>
        <p className="mt-2 text-muted">Open and past Quorums you’ve created.</p>

        {polls.length === 0 ? (
          <Card className="mt-8 border-dashed text-center">
            <p className="text-foreground">You haven’t created a poll yet.</p>
            <p className="mt-1 text-sm text-muted">Start one and it will show up here.</p>
            <div className="mt-4">
              <LinkButton href="/create">Create a poll</LinkButton>
            </div>
          </Card>
        ) : (
          <ul className="mt-8 space-y-3">
            {polls.map((poll) => {
              const responses = poll.participants.length;
              return (
                <li key={poll.publicId}>
                  <Link
                    href={adminPath(poll.publicId)}
                    className="block rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold tracking-tight">{poll.title}</h2>
                        {poll.description ? (
                          <p className="mt-1 line-clamp-2 text-sm text-muted">{poll.description}</p>
                        ) : null}
                      </div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        {poll.status === "open" ? "Open" : "Closed"}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-muted">
                      {formatCreatedAt(poll.createdAt)} · {responses}{" "}
                      {responses === 1 ? "response" : "responses"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Main>
    </PageShell>
  );
}

function formatCreatedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
