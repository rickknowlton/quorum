import { describe, expect, it } from "vitest";
import { hashSecret, matchesStoredSecret, tokensEqual } from "@/lib/auth/tokens";

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

describe("hashed secrets", () => {
  it("matches a presented token against its SHA-256 hash", () => {
    const raw = "devAdminBoozeLeagueDraftTokenLocalOnly0001";
    expect(matchesStoredSecret(raw, hashSecret(raw))).toBe(true);
    expect(matchesStoredSecret("other-token", hashSecret(raw))).toBe(false);
  });

  it("does not treat an edit token from another participant as valid", () => {
    const stored = hashSecret("edit-token-a");
    expect(matchesStoredSecret("edit-token-b", stored)).toBe(false);
    expect(matchesStoredSecret("edit-token-a", stored)).toBe(true);
  });

  it("still matches legacy plaintext stored values", () => {
    expect(matchesStoredSecret("legacy-token", "legacy-token")).toBe(true);
    expect(matchesStoredSecret("legacy-token", "other-legacy")).toBe(false);
  });
});
