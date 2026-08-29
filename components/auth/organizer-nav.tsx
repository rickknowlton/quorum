"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { CalendarDays } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { dashboardPath } from "@/lib/polls/paths";

export function OrganizerNav() {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button variant="ghost" size="sm" className="whitespace-nowrap">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
          <Button
            variant="secondary"
            size="sm"
            className="whitespace-nowrap"
            aria-label="Create account"
          >
            <span className="sm:hidden" aria-hidden="true">
              Sign up
            </span>
            <span className="max-sm:hidden">Create account</span>
          </Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <LinkButton
          href={dashboardPath()}
          variant="ghost"
          size="sm"
          className="max-sm:hidden whitespace-nowrap"
        >
          My polls
        </LinkButton>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-8",
            },
          }}
        >
          <UserButton.MenuItems>
            <UserButton.Link
              label="My polls"
              href={dashboardPath()}
              labelIcon={<CalendarDays className="size-4" />}
            />
          </UserButton.MenuItems>
        </UserButton>
      </Show>
    </div>
  );
}
