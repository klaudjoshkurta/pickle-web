import type { Metadata } from "next";
import { Suspense } from "react";
import { PollSkeleton } from "@/components/poll/PollSkeleton";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { DashboardScreen } from "@/components/creator/CreatorPollScreens";
export const metadata: Metadata = { title: "My polls", robots: { index: false } };
export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return <Suspense fallback={<PollSkeleton />}>{searchParams.then((query) => <CreatorShell closed={query.status === "CLOSED"}><DashboardScreen key={query.status === "CLOSED" ? "closed" : "open"} initialFilter={query.status === "CLOSED" ? "CLOSED" : "OPEN"} /></CreatorShell>)}</Suspense>;
}
