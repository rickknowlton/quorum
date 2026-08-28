import { Main, PageShell, SiteHeader } from "@/components/ui/shell";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell>
      <SiteHeader />
      <Main>
        <h1 className="text-2xl font-semibold">Poll not found</h1>
        <p className="mt-2 text-muted">That link may be incorrect or the poll may have been removed.</p>
        <div className="mt-6">
          <LinkButton href="/">Back home</LinkButton>
        </div>
      </Main>
    </PageShell>
  );
}
