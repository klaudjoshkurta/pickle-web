import { PollFooter } from "@/components/layout/PollFooter";

export default function PollLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="poll-theme flex min-h-dvh flex-1 flex-col">
      {children}
      <PollFooter />
    </div>
  );
}
