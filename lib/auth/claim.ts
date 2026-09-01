import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isOrganizerAuthorized } from "@/lib/auth/organizer";
import {
  adminCookieName,
  authCookieOptions,
  editCookieName,
  matchesStoredSecret,
} from "@/lib/auth/tokens";
import { adminPath, adminQuestionsPath, editPath } from "@/lib/polls/paths";

export async function claimAdminQueryToken(options: {
  publicId: string;
  storedToken: string;
  queryToken?: string;
  ownerUserId: string | null;
  destination: "admin" | "questions";
}) {
  const { queryToken } = options;
  if (!queryToken) {
    return;
  }

  const { isAuthenticated, userId } = await auth();
  const signedInUserId = isAuthenticated ? userId : undefined;
  const tokenOk = matchesStoredSecret(queryToken, options.storedToken);
  const authorized = isOrganizerAuthorized(
    { ownerUserId: options.ownerUserId, adminToken: options.storedToken },
    signedInUserId,
    queryToken,
  );
  if (!authorized) {
    return;
  }

  if (tokenOk) {
    const cookieStore = await cookies();
    cookieStore.set(
      adminCookieName(options.publicId),
      queryToken,
      authCookieOptions(options.publicId),
    );
  }

  redirect(
    options.destination === "questions"
      ? adminQuestionsPath(options.publicId)
      : adminPath(options.publicId),
  );
}

export async function claimEditQueryToken(options: {
  publicId: string;
  queryToken?: string;
  storedToken?: string;
}) {
  const { queryToken, storedToken } = options;
  if (!queryToken || !storedToken || !matchesStoredSecret(queryToken, storedToken)) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(editCookieName(options.publicId), queryToken, authCookieOptions(options.publicId));
  redirect(editPath(options.publicId));
}
