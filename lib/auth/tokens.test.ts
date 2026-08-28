import { describe, expect, it } from "vitest";
import { tokensEqual } from "@/lib/auth/tokens";

describe("token authorization", () => {
  it("accepts matching admin and edit tokens", () => {
    expect(tokensEqual("admin-secret-token", "admin-secret-token")).toBe(true);
    expect(tokensEqual("edit-secret-token", "edit-secret-token")).toBe(true);
  });

  it("rejects missing, mismatched, and different-length tokens", () => {
    expect(tokensEqual("admin-secret-token", "wrong-secret-token")).toBe(false);
    expect(tokensEqual("short", "longer-token")).toBe(false);
    expect(tokensEqual("admin-secret-token", undefined)).toBe(false);
    expect(tokensEqual(null, "admin-secret-token")).toBe(false);
    expect(tokensEqual("", "")).toBe(false);
  });
});
