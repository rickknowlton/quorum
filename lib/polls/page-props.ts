export type PollRouteProps = {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ token?: string }>;
};
