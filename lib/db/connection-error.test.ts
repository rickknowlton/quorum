import { describe, expect, it } from "vitest";
import { isDatabaseUnavailable } from "@/lib/db/connection-error";

describe("isDatabaseUnavailable", () => {
  it("detects connection refused and lookup failures", () => {
    expect(isDatabaseUnavailable({ code: "ECONNREFUSED" })).toBe(true);
    expect(isDatabaseUnavailable({ code: "ENOTFOUND" })).toBe(true);
  });

  it("walks AggregateError-style nested errors", () => {
    const error = {
      code: "ECONNREFUSED",
      errors: [
        { code: "ECONNREFUSED", address: "::1", port: 5432 },
        { code: "ECONNREFUSED", address: "127.0.0.1", port: 5432 },
      ],
    };
    expect(isDatabaseUnavailable(error)).toBe(true);
  });

  it("ignores ordinary application errors", () => {
    expect(isDatabaseUnavailable(new Error("Failed to create poll"))).toBe(false);
    expect(isDatabaseUnavailable(null)).toBe(false);
  });
});
