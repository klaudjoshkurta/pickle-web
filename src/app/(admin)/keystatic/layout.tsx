import { Suspense } from "react";
import KeystaticApp from "./keystatic";

export default function KeystaticLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Suspense fallback={<p>Loading content editor…</p>}><KeystaticApp /></Suspense>
    {children}
  </>;
}
