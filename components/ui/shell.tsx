import Link from "next/link";
import { OrganizerNav } from "@/components/auth/organizer-nav";
import { cn } from "@/lib/cn";
import { GITHUB_URL } from "@/lib/seo/site";

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

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="shrink-0 font-serif text-xl tracking-tight text-foreground">
          Quorum
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <Link href="/about" className="hover:text-foreground">
            Why Quorum
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full min-w-0 flex-col overflow-x-hidden">
      {children}
      <SiteFooter />
    </div>
  );
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
