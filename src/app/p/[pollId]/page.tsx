import type { Metadata } from "next";
import { Suspense } from "react";
import { PollScreen } from "@/components/poll/PollScreen";
import { PollSkeleton } from "@/components/poll/PollSkeleton";

export const metadata: Metadata = {
  title: "Vote",
  robots: { index: false },
};

export default function PollPage({ params }: PageProps<"/p/[pollId]">) {
  return (
    <Suspense fallback={<PollSkeleton />}>
      {params.then(({ pollId }) => (
        <PollScreen pollId={pollId} />
      ))}
    </Suspense>
  );
}
