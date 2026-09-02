import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { CreatePollForm } from "@/components/poll/create-poll-form";
import { Main, PageShell, SiteHeader } from "@/components/ui/shell";

export const metadata: Metadata = {
  title: "Create a poll",
};

export default async function CreatePage() {
  const { isAuthenticated } = await auth();

  return (
    <PageShell>
      <SiteHeader />
      <Main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight">Create a poll</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Create a poll and share one link with the group. No account required.
        </p>
        {isAuthenticated ? (
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Signed-in polls are automatically saved to My Polls.
          </p>
        ) : null}
        <div className="mt-8">
          <CreatePollForm />
        </div>
      </Main>
    </PageShell>
  );
}
