import type { Metadata } from "next";
import { Suspense } from "react";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { ManagePollScreen } from "@/components/creator/CreatorPollScreens";
import { PollSkeleton } from "@/components/poll/PollSkeleton";
export const metadata: Metadata = { title: "Manage poll", robots: { index: false } };
export default function ManagePage({ params }: PageProps<"/manage/[pollId]">) {
  return <CreatorShell><Suspense fallback={<PollSkeleton />}>{params.then(({ pollId }) => <ManagePollScreen pollId={pollId} />)}</Suspense></CreatorShell>;
}
