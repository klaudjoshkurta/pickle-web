"use client";
import { useI18n } from "@/lib/i18n/LocaleContext";
import Link from "next/link";
import { useCreatorCopy } from "@/features/creator/copy";
import { buttonClass } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthContext";
import type { CreatorPoll } from "@/features/creator/model";
import { isPollOpen, standing, totalVotes, voterCount } from "@/domain/polls/pollLogic";
import { StarterGrid } from "./StarterGrid";

export function Dashboard({polls,closed}:{polls:CreatorPoll[];closed:boolean}) {
  const c=useCreatorCopy(); const {profile}=useAuth();
  const live=polls.filter(p=>isPollOpen(p)); const settled=polls.filter(p=>!isPollOpen(p)).sort((a,b)=>Date.parse(b.closed_at??b.created_at)-Date.parse(a.closed_at??a.created_at));
  if(!polls.length&&!closed) return <>
    <h1 className="headline-pop text-3xl leading-tight">{c("greeting",{name:profile.displayName??""})}. {c("firstTitle")}</h1>
    <ol className="card flex flex-col gap-6 p-5">{([['step1','step1Hint'],['step2','step2Hint'],['step3','step3Hint']] as const).map(([title,hint],i)=><li key={title} className="flex items-center gap-4"><span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink text-xl font-bold "+(i===0?"bg-mustard text-on-mustard":"")}>{i+1}</span><div><p className="font-bold">{c(title)}</p><p className="text-sm text-ink-muted">{c(hint)}</p></div></li>)}</ol>
    <h2 className="font-semibold text-ink-muted">{c("fromTemplate")}</h2><StarterGrid compact/>
    <div className="rounded-2xl border-[1.5px] border-dashed border-ink p-7 text-center"><p className="mb-2 text-3xl">✧</p><h2 className="font-bold">{c("emptyTitle")}</h2><p className="mt-2 text-sm text-ink-muted">{c("emptyHint")}</p></div>
    <Link href="/app/new" className={buttonClass("primary","mt-5 w-full")}>+ {c("start")}</Link>
  </>;
  return <><h1 className="headline-pop text-3xl">{closed?c("closed"):c("greeting",{name:profile.displayName??""})}</h1>{!closed&&<><h2 className="font-semibold text-ink-muted">{c("liveNow")}</h2>{live.length?live.map(p=><PollCard key={p.id} poll={p}/>):<p className="text-ink-muted">{c("noLive")}</p>}<h2 className="mt-3 font-semibold text-ink-muted">{c("settled")}</h2></>}{settled.length?(closed?settled:settled.slice(0,3)).map(p=><PollCard key={p.id} poll={p}/>):<p className="text-ink-muted">{c("noClosed")}</p>}</>;
}

function PollCard({poll,href}:{poll:CreatorPoll;href?:string}) {
  const c=useCreatorCopy(); const {locale}=useI18n(); const open=isPollOpen(poll);const options=poll.poll_options.filter(o=>o.status==="APPROVED");const top=standing(poll,options);const selections=totalVotes(options);const count=voterCount(poll,options);const pending=poll.poll_options.filter(o=>o.status==="PENDING").length;
  return <Link href={href??"/p/"+poll.id} className="card flex flex-col gap-3 p-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
    <div className="flex flex-wrap items-center gap-2 text-xs"><span className={"rounded-full px-3 py-1 font-semibold "+(open?"bg-primary-soft text-primary":"bg-mustard text-on-mustard")}>{open?c("liveNow"):c("settled")}</span><span className="text-ink-muted">{poll.closed_at?c("closes",{date:new Date(poll.closed_at).toLocaleString(locale,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}):c("noDeadline")}</span><span aria-hidden className="ml-auto">→</span></div>
    <h2 className="font-bold wrap-break-word">{poll.question}</h2>
    <div aria-hidden className="flex h-2 overflow-hidden rounded-full bg-track">{options.map((o,i)=><span key={o.id} className={["bg-tomato","bg-primary","bg-mustard","bg-ink-muted"][i%4]} style={{width:selections?o.vote_count/selections*100+"%":"0"}}/>)}</div>
    <p className="text-sm text-ink-muted">{c("votes",{n:count})} · {top.kind==="empty"?c("noVotes"):top.kind==="tie"?c("tied",{n:top.options[0].vote_count}):open?c("ahead",{n:top.margin}):top.option.text}</p>
    {open&&pending>0&&<span className="self-start rounded-full border-[1.5px] border-ink bg-mustard px-3 py-1 text-sm font-bold text-on-mustard">{c("review",{n:pending})}</span>}
  </Link>;
}
