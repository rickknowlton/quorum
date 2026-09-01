"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { persistAdminCookie, persistEditCookie } from "@/app/actions/auth-cookies";

export function ClaimQueryCookie({
  publicId,
  token,
  kind,
  href,
}: {
  publicId: string;
  token: string;
  kind: "admin" | "edit";
  href: string;
}) {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    async function claim() {
      const result =
        kind === "edit"
          ? await persistEditCookie(publicId, token)
          : await persistAdminCookie(publicId, token);
      if (result.ok) {
        router.replace(href);
      }
    }

    void claim();
  }, [href, kind, publicId, router, token]);

  return null;
}
