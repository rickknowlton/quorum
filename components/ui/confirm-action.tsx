"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmAction({
  label,
  confirmLabel,
  description,
  formAction,
  variant = "danger",
}: {
  label: string;
  confirmLabel: string;
  description: string;
  formAction: (formData: FormData) => void | Promise<void>;
  variant?: "danger" | "secondary";
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-stone-50 p-3 text-sm">
      <p className="text-foreground">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={formAction}>
          <Button type="submit" variant={variant} size="sm">
            {confirmLabel}
          </Button>
        </form>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
