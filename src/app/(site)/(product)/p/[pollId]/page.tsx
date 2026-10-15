import type { Metadata } from "next";
import { Suspense } from "react";
import { FooterBanner } from "@/features/marketing/components/FooterBanner";
import { PollHeader } from "@/features/polls/components/PollHeader";
import { PollExperience } from "@/app/_components/PollExperience";
import { PollSkeleton } from "@/features/polls/components/PollSkeleton";

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
            <PollExperience pollId={pollId} />
          ))}
        </Suspense>
        <FooterBanner />
      </main>
    </>
  );
}
