"use client";

import { useI18n } from "@/lib/i18n/LocaleContext";
import { CheckIcon } from "../icons";

export interface ResultRowData {
  id: string;
  text: string;
  count: number;
  percent: number;
  isMine?: boolean;
  suggestedByYou?: boolean;
  isWinner?: boolean;
}

/** Outlined card of options with dashed dividers, teal bars, percentage and vote count. */
export function ResultRows({ rows, avatarUrl }: { rows: ResultRowData[]; avatarUrl?: string | null }) {
  if (rows.length === 0) return null;
  return (
    <ul className="@container card divide-y-2 divide-dashed divide-surface-variant overflow-hidden">
      {rows.map((row) => (
        <ResultRow key={row.id} row={row} avatarUrl={avatarUrl} />
      ))}
    </ul>
  );
}

function ResultRow({ row, avatarUrl }: { row: ResultRowData; avatarUrl?: string | null }) {
  const { t, tp } = useI18n();
  return (
    <li className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 @lg:grid-cols-[1fr_12.5rem_6.5rem] @lg:px-7">
      <div className="min-w-0">
        <p className="font-semibold wrap-break-word">{row.text}</p>
        {(row.isMine || row.suggestedByYou) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
            {row.suggestedByYou && (
              <span className="inline-flex items-center gap-1.5">
                {avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- remote SVG avatar
                  <img src={avatarUrl} alt="" width={20} height={20} className="h-5 w-5 rounded-full border border-ink bg-surface-variant" />
                )}
                {t("suggestedByYou")}
              </span>
            )}
            {row.isMine && (
              <span className="inline-flex items-center gap-1 font-semibold text-primary">
                <CheckIcon size={14} /> {t("yourPick")}
              </span>
            )}
          </p>
        )}
      </div>
      <p className="text-right whitespace-nowrap @lg:order-last">
        <span className="font-display text-xl font-bold tabular-nums">{t("percent", { n: row.percent })}</span>{" "}
        <span className="text-sm text-ink-muted">{tp("votesCount", row.count)}</span>
      </p>
      <span className="col-span-2 block h-3 overflow-hidden rounded-full bg-track @lg:col-span-1" aria-hidden>
        <span className="result-bar block h-full rounded-full bg-primary" style={{ width: `${row.percent}%` }} />
      </span>
    </li>
  );
}
