import { SiteFooter } from "@/components/layout/SiteFooter";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<SiteFooter /></>;
}
