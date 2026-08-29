import Link from "next/link";
import { OrganizerNav } from "@/components/auth/organizer-nav";
import { cn } from "@/lib/cn";

export function SiteHeader({
  action,
  showAuth = true,
}: {
  action?: React.ReactNode;
  showAuth?: boolean;
}) {
  return (
    <header className="border-b border-border/80 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 font-serif text-2xl tracking-tight text-foreground">
          Quorum
        </Link>
        <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-2">
          {action}
          {showAuth ? <OrganizerNav /> : null}
        </div>
      </div>
    </header>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-full min-w-0 flex-col overflow-x-hidden">{children}</div>;
}

export function Main({
  children,
  className = "mx-auto w-full max-w-3xl px-4 py-10 sm:py-14",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <main className={cn("min-w-0", className)}>{children}</main>;
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "max-w-full min-w-0 rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
