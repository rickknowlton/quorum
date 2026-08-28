import { SignUp } from "@clerk/nextjs";
import { Main, PageShell, SiteHeader } from "@/components/ui/shell";

export default function SignUpPage() {
  return (
    <PageShell>
      <SiteHeader showAuth={false} />
      <Main className="flex items-center justify-center py-16">
        <SignUp fallbackRedirectUrl="/dashboard" signInUrl="/sign-in" />
      </Main>
    </PageShell>
  );
}
