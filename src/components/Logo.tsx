export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="10" fill="#007564" />
      <rect x="10" y="6" width="12" height="20" rx="6" fill="#9fd86b" />
      <circle cx="14" cy="12" r="1.3" fill="#4c8a2c" />
      <circle cx="18" cy="16" r="1.3" fill="#4c8a2c" />
      <circle cx="14" cy="20" r="1.3" fill="#4c8a2c" />
    </svg>
  );
}
