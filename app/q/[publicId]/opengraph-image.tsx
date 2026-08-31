import { getPollPublicMeta } from "@/lib/polls/queries";
import { quorumOgImage } from "@/lib/seo/og-image";
import { POLL_SHARE_DESCRIPTION } from "@/lib/seo/site";

export const runtime = "nodejs";
export { ogContentType as contentType, ogSize as size } from "@/lib/seo/og-image";
export const alt = "Quorum poll";

type Props = {
  params: Promise<{ publicId: string }>;
};

export default async function PollOpenGraphImage({ params }: Props) {
  const { publicId } = await params;
  const poll = await getPollPublicMeta(publicId);

  return quorumOgImage({
    title: poll?.title ?? "Quorum poll",
    subtitle: POLL_SHARE_DESCRIPTION,
  });
}
