import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
import { clerkPublishableKey } from "@/lib/auth/clerk-env";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full overflow-x-hidden antialiased`}>
      <body className="min-h-full min-w-0 overflow-x-hidden bg-background font-sans text-foreground">
        <ClerkProvider
          publishableKey={clerkPublishableKey()}
          appearance={clerkAppearance}
          afterSignOutUrl="/"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}