/** Tomato badge with a check, matching the app icon. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14.5" fill="#e0532b" stroke="#3a2417" strokeWidth="3" />
      <path d="m10 16.5 4.2 4.2L22.5 12" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <Logo />
      <span className="font-display text-2xl font-bold leading-none">pickle</span>
    </span>
  );
}
