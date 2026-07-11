import type { Metadata } from "next";
import { Source_Serif_4, Inter, IBM_Plex_Mono } from "next/font/google";
import { DaylightSky } from "@/components/ui/daylight-sky";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Lumen — Read your solar contract in full daylight",
  description:
    "Lumen audits residential solar contracts for predatory terms. Every red flag is backed by the exact verbatim line it was extracted from — no citation, no flag.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        <DaylightSky />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
