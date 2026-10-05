import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/nunito";
import "./globals.css";

const description = "Swipe on restaurants with friends and find the place everyone agrees on.";

// Absolute base for link previews. Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "BiteMatch",
  description,
  openGraph: {
    title: "BiteMatch",
    description,
    siteName: "BiteMatch",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "BiteMatch",
    description
  }
};

export const viewport: Viewport = {
  themeColor: "#fff6ef"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
