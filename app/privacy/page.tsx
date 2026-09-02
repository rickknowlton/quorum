import type { Metadata } from "next";
import { Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { GITHUB_URL } from "@/lib/seo/site";

const description =
  "How Quorum handles organizer accounts, poll responses, and cookies. Quorum does not sell your data.";

export const metadata: Metadata = {
  title: "Privacy",
  description,
  openGraph: {
    title: "Privacy",
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    title: "Privacy",
    description,
    images: ["/opengraph-image"],
  },
};

export default function PrivacyPage() {
  return (
    <PageShell>
      <SiteHeader />
      <Main className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-24">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Legal</p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
          Privacy
        </h1>
        <p className="mt-4 text-sm text-muted">Last updated September 1, 2026</p>

        <div className="mt-8 space-y-8 text-lg leading-relaxed text-muted">
          <p>
            Quorum is a small independent project by Rick Knowlton. This page explains what the
            app stores so you can use it. It is not legal advice.
          </p>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              What Quorum stores
            </h2>
            <p className="mt-3">
              You can create a poll without an account. If you choose to save a poll to an account,
              sign-in is handled by Clerk, which holds the details used to sign in, such as an
              email address or a connected Google account.
            </p>
            <p className="mt-3">
              Polls you create are saved in Quorum’s database: titles, descriptions, questions,
              settings, and the responses people submit. Participants do not need an account.
              A response includes the name they enter and their answers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Cookies</h2>
            <p className="mt-3">
              After someone responds, Quorum sets a cookie so they can come back and edit that
              response on the same browser. Creating or opening a poll as an organizer also sets a
              cookie so this browser can manage that poll. Clerk uses cookies to keep signed-in
              organizers signed in.
            </p>
            <p className="mt-3">
              These cookies are for running the product. Quorum does not use advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Why Quorum stores it
            </h2>
            <p className="mt-3">
              Optional organizer accounts are used so you can find your polls later. Poll content
              and responses are stored so the group can vote and see results.
            </p>
            <p className="mt-3">
              Quorum also keeps a few first-party counts on each poll: whether it was created
              without an account, whether the organizer copied the private management link, whether
              they later saved it to an account, and how often that private link is opened. Those
              are used to see whether accountless creation is working. They are not used for ads,
              and they do not include the links themselves.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">How long</h2>
            <p className="mt-3">
              Data stays until the organizer or project owner deletes it, or until Quorum itself is
              shut down. There is not yet a self-serve delete-poll control; if you need a poll
              removed, ask on GitHub.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Who can see a poll</h2>
            <p className="mt-3">
              Anyone with the participant link can open that poll. If the organizer turns on
              results, other participants may see vote totals and, when names are visible, who
              answered. Don’t put secrets in a poll you intend to share.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Hosting</h2>
            <p className="mt-3">
              The site is hosted on Vercel. Account sign-in is handled by Clerk. Poll data is stored
              in a PostgreSQL database. Those providers process data as needed to run their
              services. Vercel also collects cookieless page-view analytics so I can see which
              pages are used. Query strings are stripped from those page views so a private
              organizer link is not sent to Vercel. The same product events may be sent as
              Vercel custom events, without poll IDs or links.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">What Quorum doesn’t do</h2>
            <p className="mt-3">
              Quorum does not sell your data, run ads against it, or use advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Questions</h2>
            <p className="mt-3">
              If you want a poll removed or have a privacy question, open an issue on{" "}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline-offset-4 hover:underline"
              >
                GitHub
              </a>
              .
            </p>
          </section>
        </div>
      </Main>
    </PageShell>
  );
}
