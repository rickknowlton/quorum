import { quorumOgImage } from "@/lib/seo/og-image";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/seo/site";

export { ogContentType as contentType, ogSize as size } from "@/lib/seo/og-image";
export const alt = "Quorum — make a decision with a group.";

export default function OpenGraphImage() {
  return quorumOgImage({
    title: SITE_TAGLINE,
    subtitle: SITE_DESCRIPTION,
  });
}
