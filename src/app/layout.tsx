import type { Metadata, Viewport } from "next";
import { Google_Sans, Inter } from "next/font/google";
import { FooterBanner } from "@/components/FooterBanner";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import "./globals.css";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin", "greek"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "greek"],
});

export const metadata: Metadata = {
  title: { default: "Pickle — group polls", template: "%s · Pickle" },
  description: "Vote on group polls with Pickle, right in your browser.",
};

export const viewport: Viewport = {
  themeColor: "#FAF2E3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${googleSans.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-120 flex-1 px-4 pt-2">{children}</main>
          <FooterBanner />
        </Providers>
      </body>
    </html>
  );
}
