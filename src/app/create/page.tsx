import type { Metadata } from "next";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { CreatePollScreen } from "@/components/creator/CreatePollScreen";
export const metadata: Metadata = { title: "Create poll", robots: { index: false } };
export default function CreatePage() { return <CreatorShell><CreatePollScreen /></CreatorShell>; }
