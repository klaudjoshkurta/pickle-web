import { Suspense } from "react";
import KeystaticApp from "@/components/admin/Keystatic";

export default function KeystaticLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Suspense fallback={<p>Loading content editor…</p>}><KeystaticApp /></Suspense>
    {children}
  </>;
}
