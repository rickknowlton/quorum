"use server";

import { cookies } from "next/headers";
import {
  adminCookieName,
  authCookieOptions,
  editCookieName,
  matchesStoredSecret,
} from "@/lib/auth/tokens";
import { getParticipantByEditToken, getPollByPublicId } from "@/lib/polls/queries";
import { EDIT_TOKEN_MAX } from "@/lib/validation/limits";

export async function persistEditCookie(publicId: string, token: string) {
  if (!isPresentableToken(token)) {
    return { ok: false as const };
  }

  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    return { ok: false as const };
  }

  const participant = await getParticipantByEditToken(poll.id, token);
  if (!participant || !matchesStoredSecret(token, participant.editToken)) {
    return { ok: false as const };
  }

  const cookieStore = await cookies();
  cookieStore.set(editCookieName(publicId), token, authCookieOptions(publicId));
  return { ok: true as const };
}

export async function persistAdminCookie(publicId: string, token: string) {
  if (!isPresentableToken(token)) {
    return { ok: false as const };
  }

  const poll = await getPollByPublicId(publicId);
  if (!poll || !matchesStoredSecret(token, poll.adminToken)) {
    return { ok: false as const };
  }

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName(publicId), token, authCookieOptions(publicId));
  return { ok: true as const };
}

function isPresentableToken(token: string) {
  return token.length > 0 && token.length <= EDIT_TOKEN_MAX;
}
