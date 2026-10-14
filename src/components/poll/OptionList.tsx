"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { percentOf } from "@/lib/pollLogic";
import type { PollOption } from "@/lib/types";
import { OptionCard } from "./OptionCard";

interface Props {
  labelledBy: string;
  approved: PollOption[];
  pending: PollOption[];
  selectedId: string | null;
  myVoteId: string | null;
  winnerId: string | null;
  readOnly: boolean;
  showResults: boolean;
  total: number;
  onSelect: (id: string) => void;
}

export function OptionList({
  labelledBy,
  approved,
  pending,
  selectedId,
  myVoteId,
  winnerId,
  readOnly,
  showResults,
  total,
  onSelect,
}: Props) {
  const { t } = useI18n();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = approved.findIndex((o) => o.id === selectedId);
  // Roving tabindex: the checked radio (or the first one) is the single tab stop.
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    let next: number | null = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % approved.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + approved.length) % approved.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = approved.length - 1;
    else if (e.key === " " && !readOnly) {
      e.preventDefault();
      onSelect(approved[i].id);
      return;
    }
    if (next == null) return;
    e.preventDefault();
    refs.current[next]?.focus();
    if (!readOnly) onSelect(approved[next].id);
  }

  return (
    <>
      <div role="radiogroup" aria-labelledby={labelledBy} aria-readonly={readOnly || undefined} className="flex flex-col gap-3">
        {approved.map((option, i) => (
          <OptionCard
            key={option.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            option={option}
            checked={option.id === selectedId}
            readOnly={readOnly}
            isMyVote={option.id === myVoteId}
            isWinner={option.id === winnerId}
            result={showResults ? { count: option.vote_count, percent: percentOf(option.vote_count, total) } : null}
            tabIndex={i === tabStop ? 0 : -1}
            onSelect={() => onSelect(option.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          />
        ))}
      </div>

      {pending.length > 0 && (
        <ul className="mt-3 flex flex-col gap-3">
          {pending.map((option) => (
            <li
              key={option.id}
              className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-dashed border-surface-variant px-4 py-3"
            >
              <span className="min-w-0 flex-1 break-words font-medium text-ink-muted">{option.text}</span>
              <span className="shrink-0 rounded-full bg-surface-variant px-2.5 py-0.5 text-xs font-semibold">
                {t("waitingApproval")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
