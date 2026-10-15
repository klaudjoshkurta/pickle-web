"use client";

import dynamic from "next/dynamic";
import { PollScreen } from "@/features/polls/components/PollScreen";

const OwnerControls = dynamic(() =>
  import("@/features/creator/components/CreatorControls").then((module) => module.CreatorControls),
);

// Route composition connects voting and owner tools without coupling the features.
export function PollExperience({ pollId }: { pollId: string }) {
  return <PollScreen pollId={pollId} ownerControls={OwnerControls} />;
}
