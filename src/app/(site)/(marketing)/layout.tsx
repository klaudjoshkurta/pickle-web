import { SiteFooter } from "@/features/marketing/components/SiteFooter";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<SiteFooter /></>;
}
