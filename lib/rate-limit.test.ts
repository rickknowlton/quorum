import { describe, expect, it } from "vitest";
import { clientIpFromHeaders } from "@/lib/rate-limit";

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
