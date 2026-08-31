import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/marketing/section-heading";

export function OriginStory() {
  return (
    <section className="max-w-2xl">
      <SectionHeading>Started with a fantasy football draft</SectionHeading>
      <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted">
        <p>Scheduling a fantasy football draft shouldn’t require six days of group-chat chaos.</p>
        <p>
          I needed a night everyone could make it. Then we needed to vote on league dues. Then the
          rule changes.
        </p>
        <p>So I built Quorum: one link for the timing, the questions, and the decision.</p>
      </div>
      <div className="mt-8">
        <LinkButton href="/create">Create your first Quorum</LinkButton>
      </div>
    </section>
  );
}
