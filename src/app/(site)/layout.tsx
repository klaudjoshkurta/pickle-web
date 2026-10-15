import type { Metadata, Viewport } from "next";
import { Google_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/SiteFooter";
import "../globals.css";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin", "greek"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Pickle: group polls, settled", template: "%s · Pickle" },
  description: "Ask your crew, share one link, and let the group decide. Vote on Pickle polls right in your browser.",
};

export const viewport: Viewport = {
  themeColor: "#FAF2E3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${googleSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <div className="flex flex-1 flex-col">{children}<SiteFooter /></div>
        </Providers>
      </body>
    </html>
  );
}
