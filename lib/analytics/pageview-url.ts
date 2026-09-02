/** Drop query strings so private organizer links never reach page-view analytics. */
export function stripAnalyticsQuery(url: string) {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    return parsed.toString();
  } catch {
    const queryIndex = url.indexOf("?");
    return queryIndex === -1 ? url : url.slice(0, queryIndex);
  }
}
