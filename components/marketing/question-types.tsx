import { CalendarClock, Check, CornerDownRight, List } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";

const types = [
  {
    title: "Availability",
    body: "Find the times that work best.",
    icon: CalendarClock,
  },
  {
    title: "Yes / No",
    body: "Settle a quick question.",
    icon: Check,
  },
  {
    title: "Multiple choice",
    body: "Let the group choose an option.",
    icon: List,
  },
  {
    title: "Follow-ups",
    body: "Ask another question based on an answer.",
    icon: CornerDownRight,
  },
];

export function QuestionTypes() {
  return (
    <section>
      <SectionHeading>Ask whatever needs deciding</SectionHeading>
      <ul className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2">
        {types.map((item) => (
          <li key={item.title} className="flex gap-3">
            <item.icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <h3 className="font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-1 text-muted">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
