import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { isPollOwner } from "@/lib/auth/organizer";
import { adminCookieName, tokensEqual } from "@/lib/auth/tokens";

export type PollAdminAccess = {
  ownerUserId: string | null;
  adminToken: string;
  publicId: string;
};

export async function getOrganizerAccess(poll: PollAdminAccess, queryToken?: string) {
  const { isAuthenticated, userId } = await auth();
  const owner = isAuthenticated && isPollOwner(poll, userId);
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(adminCookieName(poll.publicId))?.value;
  const presentedToken = queryToken ?? cookieToken;
  const tokenOk = tokensEqual(presentedToken, poll.adminToken);

  return {
    authorized: owner || tokenOk,
    isOwner: Boolean(owner),
    queryToken,
  };
}
