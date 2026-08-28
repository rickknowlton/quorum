import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Instrument_Serif, Geist } from "next/font/google";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";
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

export const metadata: Metadata = {
  title: {
    default: "Quorum",
    template: "%s · Quorum",
  },
  description:
    "Make a decision with a group. Participants don’t need an account.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full overflow-x-hidden antialiased`}>
      <body className="min-h-full min-w-0 overflow-x-hidden bg-background font-sans text-foreground">
        <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}