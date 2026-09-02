import { describe, expect, it } from "vitest";
import { stripAnalyticsQuery } from "@/lib/analytics/pageview-url";

describe("stripAnalyticsQuery", () => {
  it("removes search params from absolute URLs", () => {
    expect(stripAnalyticsQuery("https://findquorum.net/q/abc/admin?token=secret")).toBe(
      "https://findquorum.net/q/abc/admin",
    );
  });

  it("leaves clean URLs unchanged and strips relative query strings", () => {
    expect(stripAnalyticsQuery("https://findquorum.net/create")).toBe("https://findquorum.net/create");
    expect(stripAnalyticsQuery("/q/abc/admin?token=secret")).toBe("/q/abc/admin");
  });
});
