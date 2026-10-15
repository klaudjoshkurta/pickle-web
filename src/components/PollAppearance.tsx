"use client";
import { usePathname } from "next/navigation";
export function PollAppearance({children}: {children: React.ReactNode}) {
  const path = usePathname();
  const poll = path.startsWith("/p/") || path === "/app" || path.startsWith("/app/");
  return <div className={poll ? "poll-theme flex min-h-dvh flex-1 flex-col" : "contents"}>{children}</div>;
}
