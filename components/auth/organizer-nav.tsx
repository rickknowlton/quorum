"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { CalendarDays } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { dashboardPath } from "@/lib/polls/paths";

export function OrganizerNav() {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Show when="signed-out">
        <LinkButton href="/create" size="sm" className="whitespace-nowrap" aria-label="Create a poll">
          <span className="sm:hidden" aria-hidden="true">
            Create
          </span>
          <span className="max-sm:hidden">Create a poll</span>
        </LinkButton>
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button variant="ghost" size="sm" className="whitespace-nowrap">
            Sign in
          </Button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <LinkButton href="/create" variant="ghost" size="sm" className="whitespace-nowrap" aria-label="Create a poll">
          <span className="sm:hidden" aria-hidden="true">
            Create
          </span>
          <span className="max-sm:hidden">Create a poll</span>
        </LinkButton>
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
