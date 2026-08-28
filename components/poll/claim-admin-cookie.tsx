"use client";

import { useEffect } from "react";
import { persistAdminCookie } from "@/app/actions/admin";

export function ClaimAdminCookie({
  publicId,
  token,
}: {
  publicId: string;
  token: string;
}) {
  useEffect(() => {
    void persistAdminCookie(publicId, token);
  }, [publicId, token]);

  return null;
}
