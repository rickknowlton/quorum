import { describe, expect, it } from "vitest";
import { pollShareMetadata, privatePageMetadata, resultsShareMetadata } from "@/lib/seo/metadata";
import { POLL_SHARE_DESCRIPTION, RESULTS_SHARE_DESCRIPTION } from "@/lib/seo/site";

describe("public poll metadata", () => {
  it("uses the poll title and a generic description", () => {
    const metadata = pollShareMetadata("Weekend trip", "abc123");

    expect(metadata.title).toBe("Weekend trip");
    expect(metadata.description).toBe(POLL_SHARE_DESCRIPTION);
    expect(metadata.openGraph?.title).toBe("Weekend trip · Quorum");
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "/q/abc123/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Quorum poll",
      },
    ]);
    expect(JSON.stringify(metadata)).not.toMatch(/Yes|No|budget|answer/i);
  });

  it("does not include organizer-only or response data even if a title looks like one", () => {
    const metadata = pollShareMetadata("League dues");
    const serialized = JSON.stringify(metadata);

    expect(serialized).not.toContain("admin");
    expect(serialized).not.toContain("token");
    expect(serialized).not.toContain(RESULTS_SHARE_DESCRIPTION);
  });

  it("falls back when the title is empty", () => {
    expect(pollShareMetadata("   ").title).toBe("Poll");
  });
});

describe("results metadata", () => {
  it("summarizes without exposing vote counts", () => {
    const metadata = resultsShareMetadata("Team dinner", "abc123");
    const serialized = JSON.stringify(metadata);

    expect(metadata.description).toBe(RESULTS_SHARE_DESCRIPTION);
    expect(serialized).not.toMatch(/\d+\s+(Yes|No|Maybe)/);
  });
});

describe("private page metadata", () => {
  it("keeps thanks and organizer pages out of search", () => {
    expect(privatePageMetadata("Response saved").robots).toEqual({
      index: false,
      follow: false,
    });
  });
});
