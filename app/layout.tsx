import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fact Rot Detector",
  description: "Detect when facts in your content have gone stale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-[#0a0a0a] text-zinc-100 antialiased`}
      >
        <div className="light-trails" aria-hidden="true">
          <div className="light-trail" />
          <div className="light-trail" />
          <div className="light-trail" />
          <div className="light-trail" />
          <div className="light-trail" />
          <div className="light-trail" />
        </div>
        <Nav />
        {children}
      </body>
    </html>
  );
}
