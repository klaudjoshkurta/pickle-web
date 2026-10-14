"use client";

import { useI18n } from "@/lib/i18n/LocaleContext";

export function ResultsSummary({ total, expected }: { total: number; expected: number | null }) {
  const { t, tp } = useI18n();
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink-muted" aria-live="polite">
      <span className="font-semibold text-ink">{tp("totalVotes", total)}</span>
      {expected != null && expected > 0 && (
        <>
          <span aria-hidden>·</span>
          <span>{t("votedOfExpected", { x: total, n: expected })}</span>
        </>
      )}
    </p>
  );
}
