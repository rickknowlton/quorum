import type { Metadata } from "next";
import {
  POLL_SHARE_DESCRIPTION,
  RESULTS_SHARE_DESCRIPTION,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/seo/site";

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: `${SITE_TAGLINE} ${SITE_DESCRIPTION}`,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: `${SITE_TAGLINE} ${SITE_DESCRIPTION}`,
  },
};

function shareImages(publicId?: string) {
  if (!publicId) {
    return undefined;
  }
  return [
    {
      url: `/q/${publicId}/opengraph-image`,
      width: 1200,
      height: 630,
      alt: `${SITE_NAME} poll`,
    },
  ];
}

export function pollShareMetadata(title: string, publicId?: string): Metadata {
  const safeTitle = title.trim() || "Poll";
  const pageTitle = `${safeTitle} · ${SITE_NAME}`;
  const images = shareImages(publicId);
  return {
    title: safeTitle,
    description: POLL_SHARE_DESCRIPTION,
    openGraph: {
      title: pageTitle,
      description: POLL_SHARE_DESCRIPTION,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: POLL_SHARE_DESCRIPTION,
      ...(images ? { images } : {}),
    },
  };
}

export function resultsShareMetadata(title: string, publicId?: string): Metadata {
  const safeTitle = title.trim() || "Results";
  const pageTitle = `${safeTitle} · ${SITE_NAME}`;
  const images = shareImages(publicId);
  return {
    title: safeTitle,
    description: RESULTS_SHARE_DESCRIPTION,
    openGraph: {
      title: pageTitle,
      description: RESULTS_SHARE_DESCRIPTION,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: RESULTS_SHARE_DESCRIPTION,
      ...(images ? { images } : {}),
    },
  };
}

export function privatePageMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
    },
  };
}
