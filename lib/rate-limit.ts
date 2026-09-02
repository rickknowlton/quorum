import { sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

export const SUBMIT_PER_IP_PER_MINUTE = 20;
export const SUBMIT_PER_POLL_PER_MINUTE = 60;
export const CREATE_PER_USER_PER_HOUR = 10;
export const CREATE_PER_ANON_IP_PER_HOUR = 5;

export function pollCreationRateLimitKey(userId: string | null, ip: string) {
  return userId ? `create:user:${userId}` : `create:ip:${ip}`;
}

export function pollCreationLimit(userId: string | null) {
  return userId ? CREATE_PER_USER_PER_HOUR : CREATE_PER_ANON_IP_PER_HOUR;
}

export function clientIpFromHeaders(headerList: Headers) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first.slice(0, 128);
    }
  }

  const realIp = headerList.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp.slice(0, 128);
  }

  return "unknown";
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const resetAt = new Date(now + windowMs);

  try {
    const [row] = await db
      .insert(rateLimits)
      .values({
        key,
        count: 1,
        resetAt,
      })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${rateLimits.resetAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
          resetAt: sql`case when ${rateLimits.resetAt} <= now() then excluded.reset_at else ${rateLimits.resetAt} end`,
        },
      })
      .returning({
        count: rateLimits.count,
      });

    return { ok: (row?.count ?? 1) <= limit };
  } catch (error) {
    console.error("Rate limit check failed", error);
    return { ok: true };
  }
}

export async function limitPollSubmission(publicId: string, ip: string) {
  const perIp = await consumeRateLimit(
    `submit:ip:${ip}:${publicId}`,
    SUBMIT_PER_IP_PER_MINUTE,
    60_000,
  );
  if (!perIp.ok) {
    return { ok: false as const };
  }

  const perPoll = await consumeRateLimit(
    `submit:poll:${publicId}`,
    SUBMIT_PER_POLL_PER_MINUTE,
    60_000,
  );
  return { ok: perPoll.ok };
}

export async function limitPollCreation(userId: string | null, ip: string) {
  return consumeRateLimit(
    pollCreationRateLimitKey(userId, ip),
    pollCreationLimit(userId),
    60 * 60 * 1000,
  );
}
