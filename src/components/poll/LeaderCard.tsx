"use client";

import { useI18n } from "@/lib/i18n/LocaleContext";
import { segments } from "@/lib/pollLogic";
import { CheckIcon } from "../icons";

interface LeaderCardProps {
  appearance?: "outlined" | "soft";
  text: string;
  count: number;
  total: number;
  percent: number;
  margin: number;
  ribbon: "lead" | "winner";
  isMine?: boolean;
  suggestedByYou?: boolean;
  avatarUrl?: string | null;
}

/** The highlighted top option: tomato card, mustard corner ribbon, big percentage and per-vote segments. */
export function LeaderCard({ text, count, total, percent, margin, ribbon, isMine, suggestedByYou, avatarUrl, appearance = "outlined" }: LeaderCardProps) {
  const { t } = useI18n();
  const seg = segments(count, total);

  return (
    <section
      aria-label={`${ribbon === "winner" ? t("winner") : t("inTheLead")}: ${text}`}
      className={`relative overflow-hidden rounded-card bg-tomato p-5 text-white sm:p-7 ${appearance === "soft" ? "" : "border-2 border-ink"}`}
    >
      <Ribbon appearance={appearance}>{ribbon === "winner" ? t("winner") : t("inTheLead")}</Ribbon>

      <h2 className="pr-20 font-display text-2xl leading-tight font-bold wrap-break-word sm:pr-28 sm:text-[1.75rem]">{text}</h2>

      {(suggestedByYou || isMine) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedByYou && (
            <span className="pill bg-tomato-deep py-1.5 pl-1.5 text-white">
              {avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- remote SVG avatar
                <img src={avatarUrl} alt="" width={24} height={24} className="h-6 w-6 rounded-full bg-cream" />
              )}
              {t("suggestedByYou")}
            </span>
          )}
          {isMine && (
            <span className="pill bg-paper py-1.5 text-ink">
              <CheckIcon /> {t("yourPick")}
            </span>
          )}
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
        <p className="font-display leading-none font-bold">
          <span className="text-6xl tabular-nums">{percent}</span>
          <span className="align-top text-xl">%</span>
        </p>
        <p className="rounded-2xl bg-tomato-deep px-4 py-2 text-sm font-semibold text-white">
          <span>{t("leaderVotes", { x: count, n: total })}</span>
          {margin > 0 && <span className="font-medium text-white/90">· {t("aheadBy", { n: margin })}</span>}
        </p>
      </div>

      <div className="mt-4 flex gap-1.5" aria-hidden>
        {Array.from({ length: seg.size }, (_, i) => (
          <span
            key={i}
            style={{ "--i": i } as React.CSSProperties}
            className={`h-4 flex-1 rounded-[4px] ${i < seg.filled ? "segment-on bg-mustard" : "bg-tomato-dim"}`}
          />
        ))}
      </div>
    </section>
  );
}

export function TieCard({ names, count }: { names: string[]; count: number }) {
  const { t, tp, locale } = useI18n();
  const list = new Intl.ListFormat(locale, { type: "conjunction" }).format(names);
  return (
    <section className="relative overflow-hidden rounded-card border-2 border-ink bg-tomato p-5 text-white sm:p-7">
      <Ribbon>{t("tie")}</Ribbon>
      <h2 className="pr-20 font-display text-3xl leading-tight font-bold sm:pr-28">{t("tie")}</h2>
      <p className="mt-2 text-xl font-bold wrap-break-word">{t("tiedAtTop", { names: list })}</p>
      <p className="pill mt-4 bg-tomato-deep text-white">{tp("votesCount", count)}</p>
    </section>
  );
}

function Ribbon({ children, appearance = "outlined" }: { children: React.ReactNode; appearance?: "outlined" | "soft" }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute top-6 -right-14 w-56 rotate-38 bg-mustard py-1.5 text-center font-display text-sm font-bold tracking-wider text-ink uppercase sm:top-7 sm:-right-12 ${appearance === "soft" ? "" : "border-y-2 border-ink"}`}
    >
      {children}
    </span>
  );
}
