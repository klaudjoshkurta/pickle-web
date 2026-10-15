export function PollSkeleton({ label = "Loading poll…" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="animate-pulse motion-reduce:animate-none">
      <span className="sr-only">{label}</span>
      <div className="flex gap-2">
        <div className="h-9 w-32 rounded-full bg-surface-variant" />
        <div className="h-9 w-40 rounded-full bg-surface-variant" />
      </div>
      <div className="mt-6 h-10 w-11/12 rounded-full bg-surface-variant" />
      <div className="mt-3 h-10 w-2/3 rounded-full bg-surface-variant" />
      <div className="mt-8 h-52 rounded-card bg-surface-variant" />
      <div className="mt-6 h-44 rounded-card bg-surface-variant" />
    </div>
  );
}
