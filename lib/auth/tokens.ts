import { timingSafeEqual } from "node:crypto";

export function tokensEqual(left: string | undefined | null, right: string | undefined | null) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function adminCookieName(publicId: string) {
  return `quorum_admin_${publicId}`;
}

export function editCookieName(publicId: string) {
  return `quorum_edit_${publicId}`;
}

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  secure: process.env.NODE_ENV === "production",
};
