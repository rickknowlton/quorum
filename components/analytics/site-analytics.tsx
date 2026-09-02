"use client";

import { Analytics } from "@vercel/analytics/next";
import { stripAnalyticsQuery } from "@/lib/analytics/pageview-url";

export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => ({
        ...event,
        url: stripAnalyticsQuery(event.url),
      })}
    />
  );
}
