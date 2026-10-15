"use client";

import { useI18n } from "@/lib/i18n/LocaleContext";
import { formatRelative } from "@/lib/relativeTime";
import { isPollOpen } from "@/lib/pollLogic";
import type { Poll } from "@/lib/types";
import { ClockIcon, LockIcon } from "../icons";

export function StatusPills({ poll, showCreated = true }: { poll: Poll; showCreated?: boolean }) {
  const { t, locale } = useI18n();
  const open = isPollOpen(poll);
  const when = open ? poll.created_at : poll.closed_at;
  const deadline = poll.closed_at ? new Date(poll.closed_at) : null;
  const deadlineLabel = deadline && (deadline.toDateString() === new Date().toDateString()
    ? t("closesTodayAt", { time: deadline.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }) })
    : t("closesOn", { date: deadline.toLocaleString(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) }));

  return (
    <div className="flex flex-wrap items-center gap-2" role={open ? undefined : "status"}>
      {open ? (
        <span className="pill bg-primary-soft text-primary-hover">
          <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
          {t("statusOpen")}
        </span>
      ) : (
        <span className="pill bg-ink text-cream">
          <LockIcon size={15} />
          {t("statusClosed")}
        </span>
      )}
      {when && (!open || showCreated) && (
        <span className="pill border-2 border-surface-variant bg-paper font-medium text-ink-muted">
          <ClockIcon size={15} />
          <time dateTime={when} title={new Date(when).toLocaleString(locale)}>
            {t(open ? "startedAgo" : "closedAgo", { time: formatRelative(when, locale) })}
          </time>
        </span>
      )}
      {open && poll.closed_at && <span className="pill border border-surface-variant bg-paper text-ink-muted"><ClockIcon size={15} /><time dateTime={poll.closed_at} title={deadline?.toLocaleString(locale)}>{deadlineLabel}</time></span>}
    </div>
  );
}
