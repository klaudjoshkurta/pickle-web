"use client";

import { useI18n } from "@/lib/i18n/LocaleContext";
import type { Outcome } from "@/lib/pollLogic";
import { formatRelative } from "@/lib/relativeTime";

export function ClosedBanner({ closedAt, outcome }: { closedAt: string | null; outcome: Outcome }) {
  const { t, locale } = useI18n();
  return (
    <div role="status" className="flex items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-white">
      <LockIcon />
      <div className="min-w-0">
        <p className="font-semibold">{t("pollClosed")}</p>
        {closedAt && (
          <p className="text-sm text-white/80">
            <time dateTime={closedAt} title={new Date(closedAt).toLocaleString(locale)}>
              {t("closedAgo", { time: formatRelative(closedAt, locale) })}
            </time>
          </p>
        )}
        {outcome.kind === "tie" && <p className="mt-1 text-sm font-semibold">{t("tie")}</p>}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden className="mt-0.5 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
