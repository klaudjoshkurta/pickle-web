"use client";
import Link from "next/link";
import { useCreatorCopy } from "@/features/creator/copy";
import { buttonClass } from "@/components/ui/Button";
import { starterIds } from "@/features/creator/model";
import { TemplateIcon } from "./TemplateIcon";

export function StarterGrid({compact=false}:{compact?:boolean}) {
  const c=useCreatorCopy(); const ids=compact?starterIds.slice(0,4):starterIds;
  return <div className={compact?"flex flex-wrap gap-2":"grid grid-cols-1 gap-3 min-[360px]:grid-cols-2"}>{ids.map(id=><Link key={id} href={"/app/new?seed="+id} className={compact?buttonClass("outline"):"card flex min-h-32 flex-col items-start gap-3 p-4 focus-visible:outline-2 focus-visible:outline-primary"}><span aria-hidden className={compact?"":"text-3xl"}><TemplateIcon name={id}/></span><span className="font-bold">{c(id)}</span>{!compact&&<span className="text-sm text-ink-muted">{c(id==="date"||id==="game"?"starterMulti":"starterSingle")}</span>}</Link>)}{compact&&<Link href="/app/new" className={buttonClass("outline")}>+ {c("blank")}</Link>}</div>;
}
