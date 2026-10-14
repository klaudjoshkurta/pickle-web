"use client";

import { useI18n } from "@/lib/i18n/LocaleContext";
import type { Standing } from "@/lib/pollLogic";

export function ResultsFooter({ total, standing, live }: { total: number; standing: Standing; live: boolean }) {
  const { t, tp } = useI18n();
  const tagline =
    standing.kind === "empty"
      ? null
      : standing.final
        ? t("taglineFinal")
        : standing.kind === "tie" || standing.margin <= 2
          ? t("taglineClose")
          : t("taglineClear");

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2">
      <p className="font-display text-lg font-semibold" aria-live="polite">
        {total === 0 ? (
          t("noVotesYet")
        ) : (
          <>
            {tp("votesIn", total)}
            {tagline && <span className="text-tomato-deep"> · {tagline}</span>}
          </>
        )}
      </p>
      {live && <LiveIndicator />}
    </div>
  );
}

export function LiveIndicator() {
  const { t } = useI18n();
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-ink-muted">
      <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary/30 bg-primary-soft">
        <span className="live-dot h-2 w-2 rounded-full bg-primary" />
      </span>
      {t("live")}
    </p>
  );
}
