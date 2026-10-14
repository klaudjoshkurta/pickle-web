"use client";

import type { Ref } from "react";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { PollOption } from "@/lib/types";

export interface OptionResult {
  percent: number;
  count: number;
}

interface Props {
  ref?: Ref<HTMLButtonElement>;
  option: PollOption;
  checked: boolean;
  /** Can't be changed (locked vote or closed poll). */
  readOnly: boolean;
  isMyVote: boolean;
  isWinner: boolean;
  result: OptionResult | null;
  tabIndex: number;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function OptionCard({
  ref,
  option,
  checked,
  readOnly,
  isMyVote,
  isWinner,
  result,
  tabIndex,
  onSelect,
  onKeyDown,
}: Props) {
  const { t, tp } = useI18n();

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={readOnly || undefined}
      tabIndex={tabIndex}
      onClick={readOnly ? undefined : onSelect}
      onKeyDown={onKeyDown}
      className={`group relative flex min-h-14 w-full flex-col justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        checked ? "border-primary bg-surface" : "border-transparent bg-surface-variant"
      } ${isWinner ? "bg-primary-container" : ""} ${readOnly ? "cursor-default" : "cursor-pointer hover:border-primary/40"}`}
    >
      <span className="flex w-full items-center gap-3">
        <RadioDot checked={checked} />
        <span className="min-w-0 flex-1 break-words font-medium">{option.text}</span>
        {isWinner && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-on-primary">
            <TrophyIcon /> {t("winner")}
          </span>
        )}
        {result && (
          <span className="shrink-0 text-sm font-semibold tabular-nums">{t("percent", { n: result.percent })}</span>
        )}
      </span>

      {result && (
        <>
          <span className="block h-2.5 w-full overflow-hidden rounded-full bg-track" aria-hidden>
            <span className="result-bar block h-full rounded-full bg-primary" style={{ width: `${result.percent}%` }} />
          </span>
          <span className="flex items-center gap-1.5 text-sm text-ink-muted">
            {tp("votesCount", result.count)}
            {isMyVote && (
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                · <CheckIcon /> {t("yourPick")}
              </span>
            )}
          </span>
        </>
      )}
    </button>
  );
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${checked ? "border-primary" : "border-ink-muted"}`}
    >
      {checked && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
    </span>
  );
}

export function CheckIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  );
}
