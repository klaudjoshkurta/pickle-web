import type { Metadata } from "next";
import { Suspense } from "react";
import { FooterBanner } from "@/components/FooterBanner";
import { PollHeader } from "@/components/poll/PollHeader";
import { PollScreen } from "@/components/poll/PollScreen";
import { PollSkeleton } from "@/components/poll/PollSkeleton";

export const metadata: Metadata = {
  title: "Vote",
  robots: { index: false },
};

export default function PollPage({ params }: PageProps<"/p/[pollId]">) {
  return (
    <>
      <PollHeader />
      <main className="mx-auto flex w-full max-w-180 flex-1 flex-col gap-10 px-4 pt-4 pb-12 sm:px-6 sm:pt-4">
        <Suspense fallback={<PollSkeleton />}>
          {params.then(({ pollId }) => (
            <PollScreen pollId={pollId} />
          ))}
        </Suspense>
        <FooterBanner />
      </main>
    </>
  );
}
