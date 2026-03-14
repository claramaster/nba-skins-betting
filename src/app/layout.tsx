import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NBA Skins — Paris amicaux",
  description: "Draft mensuelle et paris sur les matchs NBA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans">
        <div className="flex min-h-screen flex-col">
          <Nav />
          <main className="flex-1 p-4 pb-24 md:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
