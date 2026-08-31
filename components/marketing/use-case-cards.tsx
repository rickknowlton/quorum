import { Check } from "lucide-react";
import { Card } from "@/components/ui/shell";
import { SectionHeading } from "@/components/marketing/section-heading";

const examples = [
  {
    title: "Fantasy Football Draft",
    items: ["When can everyone draft?", "Increase dues to $40?", "PPR or half-PPR?"],
  },
  {
    title: "Weekend Trip",
    items: ["Which weekend works?", "Beach or mountains?", "What's our budget?"],
  },
  {
    title: "Team Dinner",
    items: ["Which night works?", "Italian, Thai, or Mexican?", "Who's bringing a +1?"],
  },
];

export function UseCaseCards() {
  return (
    <section>
      <SectionHeading>Built for whatever you’re trying to settle</SectionHeading>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {examples.map((example) => (
          <li key={example.title} className={example.title === "Team Dinner" ? "sm:col-span-2 lg:col-span-1" : undefined}>
            <Card className="h-full">
              <h3 className="text-lg font-semibold tracking-tight">{example.title}</h3>
              <ul className="mt-4 space-y-3 text-foreground">
                {example.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
