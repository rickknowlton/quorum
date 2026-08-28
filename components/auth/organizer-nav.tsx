"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button, LinkButton } from "@/components/ui/button";
import { dashboardPath } from "@/lib/polls/paths";

export function OrganizerNav() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
          <Button variant="secondary" size="sm">
            Create account
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <LinkButton href={dashboardPath()} variant="ghost" size="sm">
          My polls
        </LinkButton>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-8",
            },
          }}
        />
      </Show>
    </div>
  );
}
