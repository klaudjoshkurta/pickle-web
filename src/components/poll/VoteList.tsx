"use client";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { PollOption } from "@/lib/types";
import { CheckIcon } from "../icons";
interface Props {
  labelledBy: string; options: PollOption[]; selectedIds: string[];
  multiple: boolean; disabled: boolean; onSelect: (id: string) => void;
}
export function VoteList({ labelledBy, options, selectedIds, multiple, disabled, onSelect }: Props) {
  const { t } = useI18n();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabStop = Math.max(0, options.findIndex((o) => selectedIds.includes(o.id)));
  return <div role={multiple ? "group" : "radiogroup"} aria-labelledby={labelledBy} className="flex flex-col gap-2">
    {options.map((option, i) => {
      const checked = selectedIds.includes(option.id);
      return <button key={option.id} ref={(el) => { refs.current[i] = el; }} type="button"
        role={multiple ? "checkbox" : "radio"} aria-checked={checked} disabled={disabled}
        tabIndex={multiple || i === tabStop ? 0 : -1} onClick={() => onSelect(option.id)}
        onKeyDown={(e) => {
          if (multiple) return;
          const next = e.key === "Home" ? 0 : e.key === "End" ? options.length - 1 :
            ["ArrowRight", "ArrowDown"].includes(e.key) ? (i + 1) % options.length :
            ["ArrowLeft", "ArrowUp"].includes(e.key) ? (i - 1 + options.length) % options.length : null;
          if (next !== null) { e.preventDefault(); refs.current[next]?.focus(); if (!disabled) onSelect(options[next].id); }
        }}
        className={"vote-option flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " + (checked ? "border-primary bg-primary-soft" : "border-ink bg-paper")}>
        <span aria-hidden className={"flex h-5 w-5 shrink-0 items-center justify-center border-[1.5px] " + (multiple ? "rounded " : "rounded-full ") + (checked ? "border-primary bg-primary text-on-primary" : "border-ink-muted")}>
          {checked && <CheckIcon size={14} />}
        </span>
        <span className="min-w-0 font-semibold wrap-break-word">{option.text}
          {option.suggested_by && <span className="mt-1 block text-xs font-normal text-ink-muted">{t("suggestedOption")}</span>}
        </span>
      </button>;
    })}
  </div>;
}
