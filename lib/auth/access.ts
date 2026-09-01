import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { isOrganizerAuthorized, isPollOwner } from "@/lib/auth/organizer";
import { adminCookieName } from "@/lib/auth/tokens";

export type PollAdminAccess = {
  ownerUserId: string | null;
  adminToken: string;
  publicId: string;
};

export async function getOrganizerAccess(poll: PollAdminAccess, queryToken?: string) {
  const { isAuthenticated, userId } = await auth();
  const signedInUserId = isAuthenticated ? userId : undefined;
  const owner = isPollOwner(poll, signedInUserId);
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(adminCookieName(poll.publicId))?.value;
  const presentedToken = queryToken ?? cookieToken;
  const authorized = isOrganizerAuthorized(poll, signedInUserId, presentedToken);

  return {
    authorized,
    isOwner: Boolean(owner),
    queryToken,
  };
}
