import { describe, expect, it } from "vitest";
import { resolveSubmitMode } from "@/lib/responses/submit-mode";

describe("resolveSubmitMode", () => {
  it("edits when the form sends a matching token", () => {
    expect(resolveSubmitMode("token-a", true)).toBe("edit");
  });

  it("rejects an explicit edit token that does not match", () => {
    expect(resolveSubmitMode("stale-token", false)).toBe("invalid-edit-link");
  });

  it("creates a new response when only a stale cookie is present", () => {
    expect(resolveSubmitMode(undefined, false)).toBe("create");
  });

  it("edits when a cookie matches an existing participant", () => {
    expect(resolveSubmitMode(undefined, true)).toBe("edit");
  });
});
