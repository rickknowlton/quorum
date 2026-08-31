import Link from "next/link";

export function PublicPollCredit() {
  return (
    <p className="mt-12 text-sm text-muted">
      Made with{" "}
      <Link href="/" className="text-foreground underline-offset-4 hover:underline">
        Quorum
      </Link>
      .{" "}
      <Link href="/create" className="text-foreground underline-offset-4 hover:underline">
        Create your own
      </Link>
    </p>
  );
}
