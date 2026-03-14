import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

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
    <html lang="fr" className={`${bebas.variable} ${inter.variable}`}>
      <body className="font-body">
        <div className="flex min-h-screen flex-col">
          <Nav />
          <main className="flex-1 p-4 pb-20">{children}</main>
        </div>
      </body>
    </html>
  );
}
