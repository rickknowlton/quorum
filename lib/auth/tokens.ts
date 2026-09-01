import { createHash } from "node:crypto";
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

export function hashSecret(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function matchesStoredSecret(
  presented: string | undefined | null,
  stored: string | undefined | null,
) {
  if (!presented || !stored) {
    return false;
  }

  return tokensEqual(hashSecret(presented), stored) || tokensEqual(presented, stored);
}

export function secretLookupValues(presented: string) {
  const hashed = hashSecret(presented);
  return hashed === presented ? [presented] : [hashed, presented];
}

export function adminCookieName(publicId: string) {
  return `quorum_admin_${publicId}`;
}

export function editCookieName(publicId: string) {
  return `quorum_edit_${publicId}`;
}

export function authCookieOptions(publicId: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: `/q/${publicId}`,
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  };
}

export function authCookieDeleteOptions(publicId: string) {
  return {
    path: `/q/${publicId}`,
  };
}
