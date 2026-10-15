"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { percentOf } from "@/lib/pollLogic";
import type { PollOption } from "@/lib/types";
import { CheckIcon } from "../icons";

interface Props {
  labelledBy: string;
  options: PollOption[];
  selectedIds: string[];
  multiple: boolean;
  myVoteIds: string[];
  disabled: boolean;
  /** Show bars/counts next to options (results visible before voting, or while changing a vote). */
  showResults: boolean;
  total: number;
  userId: string | null;
  onSelect: (id: string) => void;
}

/** Selectable options as a radio group inside one outlined card. */
export function VoteList({ labelledBy, options, selectedIds, multiple, myVoteIds, disabled, showResults, total, userId, onSelect }: Props) {
  const { t, tp } = useI18n();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => selectedIds.includes(o.id));
  // Roving tabindex: the checked radio (or the first) is the single tab stop.
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const last = options.length - 1;
    const keys: Record<string, number> = {
      ArrowDown: i === last ? 0 : i + 1,
      ArrowRight: i === last ? 0 : i + 1,
      ArrowUp: i === 0 ? last : i - 1,
      ArrowLeft: i === 0 ? last : i - 1,
      Home: 0,
      End: last,
    };
    if (e.key === " " && !disabled) {
      e.preventDefault();
      onSelect(options[i].id);
      return;
    }
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    refs.current[next]?.focus();
    if (!disabled && !multiple) onSelect(options[next].id);
  }

  return (
    <div role={multiple ? "group" : "radiogroup"} aria-labelledby={labelledBy} aria-disabled={disabled || undefined} className="card divide-y-2 divide-dashed divide-surface-variant p-2">
      {options.map((option, i) => {
        const checked = selectedIds.includes(option.id);
        const percent = percentOf(option.vote_count, total);
        return (
          <div key={option.id} className="py-1 first:pt-0 last:pb-0">
            <button
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={checked}
              tabIndex={multiple || i === tabStop ? 0 : -1}
              disabled={disabled}
              onClick={disabled ? undefined : () => onSelect(option.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex min-h-14 w-full flex-col justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                checked ? "border-primary bg-primary-soft/45" : "border-transparent hover:bg-surface-variant/50"
              } ${disabled ? "cursor-default" : "cursor-pointer"}`}
            >
              <span className="flex w-full items-center gap-3">
                <span
                  aria-hidden
                  className={`flex h-6 w-6 shrink-0 items-center justify-center ${multiple ? "rounded-md" : "rounded-full"} border-2 ${checked ? "border-primary bg-paper" : "border-ink/60 bg-paper"}`}
                >
                  {checked && (multiple ? <CheckIcon size={16} /> : <span className="h-3 w-3 rounded-full bg-primary" />)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold wrap-break-word">{option.text}</span>
                  {(myVoteIds.includes(option.id) || (userId && option.suggested_by === userId)) && (
                    <span className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-ink-muted">
                      {userId && option.suggested_by === userId && <span>{t("suggestedByYou")}</span>}
                      {myVoteIds.includes(option.id) && (
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <CheckIcon size={14} /> {t("yourPick")}
                        </span>
                      )}
                    </span>
                  )}
                </span>
                {showResults && (
                  <span className="shrink-0 text-right whitespace-nowrap">
                    <span className="font-display text-lg font-bold tabular-nums">{t("percent", { n: percent })}</span>{" "}
                    <span className="text-sm text-ink-muted">{tp("votesCount", option.vote_count)}</span>
                  </span>
                )}
              </span>
              {showResults && (
                <span className="ml-9 block h-2.5 overflow-hidden rounded-full bg-track" aria-hidden>
                  <span className="result-bar block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
