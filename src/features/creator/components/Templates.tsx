"use client";
import Link from "next/link";
import { useCreatorCopy } from "@/features/creator/copy";
import { buttonClass } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { PollTemplate } from "@/features/creator/model";
import { StarterGrid } from "./StarterGrid";
import { TemplateIcon } from "./TemplateIcon";

export function Templates({templates}:{templates:PollTemplate[]}) {
  const c=useCreatorCopy(); const {locale}=useI18n();
  return <><h1 className="headline-pop text-3xl">{c("templates")}</h1><p className="text-ink-muted">{c("useTemplateIntro")}</p><h2 className="font-semibold text-ink-muted">{c("personal")}</h2>{!templates.length&&<p className="text-ink-muted">{c("noTemplates")}</p>}{templates.map(t=><div key={t.id} className="card flex flex-wrap items-center gap-3 p-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-mustard text-2xl text-on-mustard" aria-hidden><TemplateIcon name={t.icon}/></span><div className="min-w-0 flex-1"><h3 className="font-bold wrap-break-word">{t.name} ↻</h3><p className="text-sm text-ink-muted">{c("rounds",{n:t.rounds_count,options:t.option_texts.length})}{t.schedule_weekday&&<> · {new Intl.DateTimeFormat(locale,{weekday:"long",timeZone:"UTC"}).format(new Date(Date.UTC(2026,9,11+t.schedule_weekday)))} · {t.schedule_time?.slice(0,5)} · {t.timezone}</>}</p></div><Link href={"/app/new?template="+t.id} className={buttonClass()}>{c("use")}</Link></div>)}<h2 className="mt-3 font-semibold text-ink-muted">{c("starters")}</h2><StarterGrid/></>;
}
