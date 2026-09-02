"use client";

import { useState } from "react";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { claimPollAction } from "@/app/actions/admin";
import { productEvent, trackProduct } from "@/lib/analytics/product";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/fields";
import { adminPath } from "@/lib/polls/paths";

export function SavePollToAccount({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const returnPath = adminPath(publicId);

  async function save() {
    setPending(true);
    setError(null);
    const result = await claimPollAction(publicId);
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    trackProduct(productEvent.pollClaimed);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-4 text-sm">
      <p className="font-medium">Save this poll to your account</p>
      <p className="mt-1 text-muted">
        Keep it in My Polls and recover access from any device. If you skip this, save the private
        organizer link — anyone with that link can manage the poll.
      </p>
      <Show when="signed-out">
        <div className="mt-3 flex flex-wrap gap-2">
          <SignInButton mode="modal" forceRedirectUrl={returnPath}>
            <Button variant="secondary" size="sm">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl={returnPath}>
            <Button size="sm">Create account</Button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="mt-3">
          <Button size="sm" onClick={() => void save()} disabled={pending}>
            {pending ? "Saving…" : "Save to My Polls"}
          </Button>
        </div>
      </Show>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
