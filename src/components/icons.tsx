type IconProps = { size?: number; className?: string };

function Svg({ size = 16, className, children, strokeWidth = 2.5 }: IconProps & { children: React.ReactNode; strokeWidth?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={3}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const LockIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);

export const CopyIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Svg>
);

export const ShareIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const PlayIcon = (p: IconProps) => (
  <svg aria-hidden width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" className={p.className}>
    <path fill="currentColor" d="M4.6 2.3c-.4.3-.6.8-.6 1.4v16.6c0 .6.2 1.1.6 1.4l9.3-9.7-9.3-9.7Zm10.6 8.4 2.6-2.7L7 1.9c-.5-.3-1-.3-1.4-.1l9.6 8.9Zm0 2.6-9.6 8.9c.4.2.9.2 1.4-.1l10.8-6.1-2.6-2.7Zm3.9-4.5-2.9 3.2 2.9 3.2 3-1.7c.9-.5.9-2.5 0-3l-3-1.7Z" />
  </svg>
);

export const BoltIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </Svg>
);

export const SparkIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
  </Svg>
);

export const ScaleIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7ZM19 7l-3 7a3 3 0 0 0 6 0l-3-7Z" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);
