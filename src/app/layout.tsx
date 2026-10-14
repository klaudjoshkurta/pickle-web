import type { Metadata, Viewport } from "next";
import { Fredoka, Google_Sans, Inter, M_PLUS_Rounded_1c } from "next/font/google";
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

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const rounded = M_PLUS_Rounded_1c({
  variable: "--font-rounded",
  subsets: ["greek"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: { default: "Pickle: group polls, settled", template: "%s · Pickle" },
  description: "Ask your crew, share one link, and let the group decide. Vote on Pickle polls right in your browser.",
};

export const viewport: Viewport = {
  themeColor: "#FAF2E3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [googleSans, inter, fredoka, rounded].map((f) => f.variable).join(" ");
  return (
    <html lang="en" className={`${fonts} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <div className="flex flex-1 flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
