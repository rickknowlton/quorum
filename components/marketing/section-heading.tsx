export function SectionHeading({
  children,
  support,
}: {
  children: React.ReactNode;
  support?: string;
}) {
  return (
    <div className="max-w-2xl">
      <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">{children}</h2>
      {support ? <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted">{support}</p> : null}
    </div>
  );
}
