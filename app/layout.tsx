import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiteMatch",
  description: "A group restaurant decision app for friends who are hungry now."
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
