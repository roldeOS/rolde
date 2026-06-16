import type { Metadata } from "next";
import { IBM_Plex_Serif, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// RolDe brand spine: IBM Plex Serif headlines + Inter body + IBM Plex Mono.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RolDe OS",
  description: "The clinical operating system, built by a doctor.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
