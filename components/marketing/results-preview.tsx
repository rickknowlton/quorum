import { SectionHeading } from "@/components/marketing/section-heading";

const times = [
  {
    rank: 1,
    label: "Wednesday, 7:00-9:00 PM",
    tally: "10 Yes · 2 Maybe · 0 No",
    badges: ["Unanimous", "Most yes votes"],
  },
  {
    rank: 2,
    label: "Thursday, 7:00-9:00 PM",
    tally: "9 Yes · 2 Maybe · 1 No",
    badges: [],
  },
];

export function ResultsPreview() {
  return (
    <section>
      <SectionHeading support="Quorum ranks the best times and summarizes votes so you don’t have to decipher a spreadsheet.">
        See where the group agrees
      </SectionHeading>
      <div className="mt-8 max-w-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Best times</p>
        <ol className="mt-3 space-y-3">
          {times.map((item) => (
            <li key={item.rank} className="rounded-lg border border-border bg-surface px-4 py-3">
              <p className="font-medium">
                {item.rank}. {item.label}
              </p>
              <p className="mt-1 text-sm text-muted">{item.tally}</p>
              {item.badges.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {item.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-foreground"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
