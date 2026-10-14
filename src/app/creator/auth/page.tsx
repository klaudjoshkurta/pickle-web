import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { CreatorAuthScreen } from "@/components/creator/CreatorAuthScreen";
export const metadata: Metadata = { title: "Creator sign in", robots: { index: false } };
export default function CreatorAuthPage() {
  return <><Header /><CreatorAuthScreen /></>;
}
