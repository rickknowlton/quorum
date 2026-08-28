import type { Metadata } from "next";
import { CreatePollForm } from "@/components/poll/create-poll-form";
import { Main, PageShell, SiteHeader } from "@/components/ui/shell";

export const metadata: Metadata = {
  title: "Create a poll",
};

export default function CreatePage() {
  return (
    <PageShell>
      <SiteHeader />
      <Main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight">Create a poll</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Add a title and a few questions. This poll will be saved to your account, and you’ll get
          one link to share with the group.
        </p>
        <div className="mt-8">
          <CreatePollForm />
        </div>
      </Main>
    </PageShell>
  );
}
