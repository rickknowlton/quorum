import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/button";
import { Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { GITHUB_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Why Quorum",
  description:
    "Quorum started as a way to schedule a fantasy football draft and vote on the rest without another group-chat mess.",
  openGraph: {
    title: "Why Quorum",
    description:
      "Quorum started as a way to schedule a fantasy football draft and vote on the rest without another group-chat mess.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    title: "Why Quorum",
    description:
      "Quorum started as a way to schedule a fantasy football draft and vote on the rest without another group-chat mess.",
    images: ["/opengraph-image"],
  },
};

export default function AboutPage() {
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
      <Main className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-24">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">About</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
          Why Quorum?
        </h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted">
          <p>I built Quorum because I needed to schedule my fantasy football draft.</p>
          <p>
            The usual scheduling tools used to make that dead simple. Then they got heavier than I
            wanted for a small group poll.
          </p>
          <p>
            Our league also had other things to vote on - dues, rules, scoring changes - and using
            separate tools for every question felt ridiculous.
          </p>
          <p>So I built one place for both.</p>
          <p>
            Quorum is meant to be simple: create a poll, send one link, let everyone respond, and
            see where the group agrees.
          </p>
        </div>
        <p className="mt-10 text-sm text-muted">
          Built by Rick Knowlton as a small independent project.{" "}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            View on GitHub
          </a>
          .
        </p>
        <p className="mt-3 text-sm text-muted">
          Site icon by{" "}
          <a
            href="https://www.flaticon.com/authors/fach"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Fach
          </a>{" "}
          from{" "}
          <a
            href="https://www.flaticon.com"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Flaticon
          </a>
          .
        </p>
        <div className="mt-8">
          <LinkButton href="/create">Create a poll</LinkButton>
        </div>
      </Main>
    </PageShell>
  );
}
