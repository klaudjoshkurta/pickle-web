export function PollSkeleton({ label = "Loading poll…" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="card animate-pulse motion-reduce:animate-none">
      <span className="sr-only">{label}</span>
      <div className="h-7 w-4/5 rounded-full bg-surface-variant" />
      <div className="mt-2 h-7 w-1/2 rounded-full bg-surface-variant" />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-surface-variant" />
        ))}
      </div>
      <div className="mt-6 h-12 rounded-full bg-surface-variant" />
    </div>
  );
}
