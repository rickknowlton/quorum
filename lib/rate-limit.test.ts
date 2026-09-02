import { describe, expect, it } from "vitest";
import {
  CREATE_PER_ANON_IP_PER_HOUR,
  CREATE_PER_USER_PER_HOUR,
  clientIpFromHeaders,
  pollCreationLimit,
  pollCreationRateLimitKey,
} from "@/lib/rate-limit";

describe("clientIpFromHeaders", () => {
  it("uses the leftmost forwarded address", () => {
    const headers = new Headers({
      "x-forwarded-for": " 203.0.113.10, 10.0.0.1 ",
      "x-real-ip": "10.0.0.1",
    });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip and then unknown", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});

describe("poll creation limits", () => {
  it("uses a per-user bucket when signed in", () => {
    expect(pollCreationRateLimitKey("user_abc", "203.0.113.10")).toBe("create:user:user_abc");
    expect(pollCreationLimit("user_abc")).toBe(CREATE_PER_USER_PER_HOUR);
  });

  it("uses a per-IP bucket for anonymous creation", () => {
    expect(pollCreationRateLimitKey(null, "203.0.113.10")).toBe("create:ip:203.0.113.10");
    expect(pollCreationLimit(null)).toBe(CREATE_PER_ANON_IP_PER_HOUR);
  });
});
