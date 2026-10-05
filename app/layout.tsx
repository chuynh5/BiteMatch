import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/nunito";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiteMatch",
  description: "Swipe on restaurants with friends and find the place everyone agrees on."
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
