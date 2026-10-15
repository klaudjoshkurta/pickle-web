import type { Metadata } from "next";
import SiteLayout from "@/app/(site)/layout";
import NotFound from "@/app/(site)/not-found";
import MarketingLayout from "@/app/(site)/(marketing)/layout";

export const metadata: Metadata = {
  title: "Page not found · Pickle",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return <SiteLayout><MarketingLayout><NotFound /></MarketingLayout></SiteLayout>;
}
