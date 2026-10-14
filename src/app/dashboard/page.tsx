import type { Metadata } from "next";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { DashboardScreen } from "@/components/creator/CreatorPollScreens";
export const metadata: Metadata = { title: "My polls", robots: { index: false } };
export default function DashboardPage() { return <CreatorShell><DashboardScreen /></CreatorShell>; }
