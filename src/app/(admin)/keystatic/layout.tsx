import { Suspense } from "react";
import KeystaticApp from "./keystatic";

export default function KeystaticLayout() {
  return <Suspense fallback={<p>Loading content editor…</p>}><KeystaticApp /></Suspense>;
}
