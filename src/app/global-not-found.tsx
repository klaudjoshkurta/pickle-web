import type { Metadata } from "next";
import SiteLayout from "./(site)/layout";
import NotFound from "./(site)/not-found";

export const metadata: Metadata = {
  title: "Page not found · Pickle",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return <SiteLayout><NotFound /></SiteLayout>;
}
