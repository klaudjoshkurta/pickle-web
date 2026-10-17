"use client";

import { PollScreen } from "@/features/polls/components/PollScreen";

export function PollExperience({ pollId }: { pollId: string }) {
  return <PollScreen pollId={pollId} />;
}
