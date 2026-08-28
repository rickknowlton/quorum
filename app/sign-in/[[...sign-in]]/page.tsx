import { SignIn } from "@clerk/nextjs";
import { Main, PageShell, SiteHeader } from "@/components/ui/shell";

export default function SignInPage() {
  return (
    <PageShell>
      <SiteHeader showAuth={false} />
      <Main className="flex items-center justify-center py-16">
        <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
      </Main>
    </PageShell>
  );
}
