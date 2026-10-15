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
  isSuggested?: boolean;
}

/** Outlined card of options with dashed dividers, teal bars, percentage and vote count. */
export function ResultRows({ rows, avatarUrl, appearance = "outlined", barMaxCount }: { rows: ResultRowData[]; avatarUrl?: string | null; appearance?: "outlined" | "soft"; barMaxCount?: number }) {
  if (rows.length === 0) return null;
  return (
    <ul className={`@container divide-surface-variant overflow-hidden ${appearance === "soft" ? "rounded-card bg-paper divide-y" : "card divide-y-2 divide-dashed"}`}>
      {rows.map((row) => (
        <ResultRow key={row.id} row={row} avatarUrl={avatarUrl} barMaxCount={barMaxCount} />
      ))}
    </ul>
  );
}

function ResultRow({ row, avatarUrl, barMaxCount }: { row: ResultRowData; avatarUrl?: string | null; barMaxCount?: number }) {
  const { t, tp } = useI18n();
  return (
    <li className="grid min-h-20 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-5 @2xl:grid-cols-[minmax(0,1fr)_12.5rem_6.5rem] @2xl:px-7">
      <div className="min-w-0">
        <p className="font-display text-lg font-semibold leading-snug wrap-break-word">{row.text}</p>
        {row.isSuggested && !row.suggestedByYou && <p className="mt-1 text-sm text-ink-muted">{t("suggestedOption")}</p>}
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
      <p className="text-right whitespace-nowrap @2xl:order-last">
        <span className="font-display text-xl font-bold tabular-nums">{t("percent", { n: row.percent })}</span>{" "}
        <span className="text-sm text-ink-muted">{tp("votesCount", row.count)}</span>
      </p>
      <span className="col-span-2 block h-3 overflow-hidden rounded-full bg-track @2xl:col-span-1" aria-hidden>
        <span className="result-bar block h-full rounded-full bg-primary" style={{ width: `${barMaxCount && barMaxCount > 0 ? Math.min(100, (row.count / barMaxCount) * 100) : row.percent}%` }} />
      </span>
    </li>
  );
}
