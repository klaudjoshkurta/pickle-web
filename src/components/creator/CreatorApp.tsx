/* eslint-disable @next/next/no-img-element -- shared DiceBear profile SVGs */
"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { useCreatorCopy, type CopyKey } from "@/lib/creator/copy";
import { starterIds, type CreatorPoll, type PollTemplate, type Activity } from "@/lib/creator/model";
import { useCreatorData } from "@/lib/creator/useCreatorData";
import { markRead } from "@/lib/creator/api";
import { isPollOpen, standing, totalVotes, voterCount } from "@/lib/pollLogic";
import { CheckIcon } from "../icons";
import { Button, buttonClass } from "../ui/Button";
import { ShareBar } from "../poll/ShareBar";
import { LeaderCard } from "../poll/LeaderCard";
import { AuthScreen } from "./AuthScreen";
import { TemplateIcon } from "./TemplateIcon";
import { CreatePoll } from "./CreatePoll";

export function CreatorApp() {
  const auth=useAuth(); const path=usePathname(); const search=useSearchParams(); const c=useCreatorCopy();
  const account=auth.user && !auth.user.is_anonymous && !auth.user.user_metadata.pickle_account_pending ? auth.user : null;
  const section=path.slice(5).replace(/^\//,"") || "home";
  const {data,error,refresh}=useCreatorData(["demo","login","signup"].includes(section)?null:account?.id??null,section);
  const unread=data?.notifications.filter(n=>!n.is_read).length??0;
  return <>
    <header className="creator-header mx-auto flex w-full max-w-180 flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
      <Link href="/app" className="flex items-center gap-2 rounded font-extrabold focus-visible:outline-2 focus-visible:outline-primary"><span className="flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-ink bg-tomato text-white"><CheckIcon size={18}/></span><span className="text-2xl">pickle</span></Link>
      <div className="flex flex-wrap items-center gap-2">{account && <><Link href="/app/new" className={buttonClass("outline")}>+ {c("newPoll")}</Link><Link href="/app/notifications" aria-label={c("notifications")+(unread?" ("+unread+")":"")} className="creator-icon-link"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4l-2 4Zm5 3h4"/></svg>{unread>0&&<span className="rounded-full bg-mustard px-1 text-xs text-on-mustard">{unread}</span>}</Link><Link href="/app/account" aria-label={c("account")} className="creator-icon-link overflow-hidden bg-primary-soft">{auth.profile.avatarUrl?<img src={auth.profile.avatarUrl} alt="" width={40} height={40}/>:auth.profile.displayName?.slice(0,1)}</Link></>}</div>
    </header>
    <main className="creator-main mx-auto flex w-full max-w-180 flex-1 flex-col gap-5 px-4 pt-3 pb-10 sm:px-6">
      {!auth.restored ? <p role="status">{c("loading")}</p> : section==="login" || section==="signup" ? <AuthScreen key={section+":"+auth.user?.id} signup={section==="signup"}/> : section==="demo" ? <Demo/> : !account ? <Welcome pending={Boolean(auth.user?.user_metadata.pickle_account_pending)}/> : <>
        <nav className="creator-tabs flex flex-wrap gap-2 rounded-3xl bg-surface-variant p-1" aria-label={c("myPolls")}>
          {([['home','/app','myPolls'],['closed','/app/closed','closed'],['templates','/app/templates','templates']] as const).map(([id,href,key])=><Link key={id} href={href} aria-current={section===id?"page":undefined} className={buttonClass(section===id?"outline":"text")}>{c(key)}</Link>)}
        </nav>
        {error&&<div role="alert" className="card flex flex-wrap items-center gap-3 p-4"><p className="flex-1">{c("loadError")}</p><Button variant="outline" onClick={refresh}>{c("retry")}</Button></div>}
        {!data ? !error&&<p role="status">{c("loading")}</p> : section==="home" || section==="closed" ? <Dashboard polls={data.polls} closed={section==="closed"}/> : section==="templates" ? <Templates templates={data.templates}/> : section==="new" ? <CreatePoll key={account.id+":"+(search.get("seed")??"")+":"+(search.get("template")??"")} owner={account.id} templates={data.templates} polls={data.polls}/> : section==="notifications" ? <Notifications items={data.notifications} owner={account.id} refresh={refresh}/> : section==="account" ? <Account polls={data.polls}/> : section==="share" && search.get("poll") ? <div className="flex flex-col gap-5 py-6"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-ink bg-mustard text-on-mustard"><CheckIcon size={36}/></span><h1 className="headline-pop text-center text-3xl">{c("liveTitle")}</h1><ShareBar pollId={search.get("poll")!} question={data.polls.find(p=>p.id===search.get("poll"))?.question??c("liveTitle")} closed={false}/><Link href={"/p/"+search.get("poll")} className={buttonClass()}>{c("watch")}</Link><Link href="/app" className={buttonClass("outline")}>{c("returnHome")}</Link></div> : <h1>{c("notFound")}</h1>}
      </>}
    </main>
  </>;
}
function Welcome({pending}:{pending:boolean}) {
  const c=useCreatorCopy();
  return <section className="mx-auto flex w-full max-w-md flex-col gap-5 py-8"><h1 className="headline-pop text-4xl leading-tight">{c("welcome")}</h1><p className="text-ink-muted">{c("intro")}</p><p>{c("accountRequired")}</p><Link href="/app/signup" className={buttonClass()}>{c(pending?"finish":"signUp")}</Link><Link href="/app/login" className={buttonClass("outline")}>{c("signIn")}</Link><Link href="/app/demo" className={buttonClass("text")}>{c("tryDemo")}</Link></section>;
}
function Dashboard({polls,closed}:{polls:CreatorPoll[];closed:boolean}) {
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
export function StarterGrid({compact=false}:{compact?:boolean}) {
  const c=useCreatorCopy(); const ids=compact?starterIds.slice(0,4):starterIds;
  return <div className={compact?"flex flex-wrap gap-2":"grid grid-cols-1 gap-3 min-[360px]:grid-cols-2"}>{ids.map(id=><Link key={id} href={"/app/new?seed="+id} className={compact?buttonClass("outline"):"card flex min-h-32 flex-col items-start gap-3 p-4 focus-visible:outline-2 focus-visible:outline-primary"}><span aria-hidden className={compact?"":"text-3xl"}><TemplateIcon name={id}/></span><span className="font-bold">{c(id)}</span>{!compact&&<span className="text-sm text-ink-muted">{c(id==="date"||id==="game"?"starterMulti":"starterSingle")}</span>}</Link>)}{compact&&<Link href="/app/new" className={buttonClass("outline")}>+ {c("blank")}</Link>}</div>;
}
function Templates({templates}:{templates:PollTemplate[]}) {
  const c=useCreatorCopy(); const {locale}=useI18n();
  return <><h1 className="headline-pop text-3xl">{c("templates")}</h1><p className="text-ink-muted">{c("useTemplateIntro")}</p><h2 className="font-semibold text-ink-muted">{c("personal")}</h2>{!templates.length&&<p className="text-ink-muted">{c("noTemplates")}</p>}{templates.map(t=><div key={t.id} className="card flex flex-wrap items-center gap-3 p-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-mustard text-2xl text-on-mustard" aria-hidden><TemplateIcon name={t.icon}/></span><div className="min-w-0 flex-1"><h3 className="font-bold wrap-break-word">{t.name} ↻</h3><p className="text-sm text-ink-muted">{c("rounds",{n:t.rounds_count,options:t.option_texts.length})}{t.schedule_weekday&&<> · {new Intl.DateTimeFormat(locale,{weekday:"long",timeZone:"UTC"}).format(new Date(Date.UTC(2026,9,11+t.schedule_weekday)))} · {t.schedule_time?.slice(0,5)} · {t.timezone}</>}</p></div><Link href={"/app/new?template="+t.id} className={buttonClass()}>{c("use")}</Link></div>)}<h2 className="mt-3 font-semibold text-ink-muted">{c("starters")}</h2><StarterGrid/></>;
}
function Notifications({items,owner,refresh}:{items:Activity[];owner:string;refresh:()=>Promise<boolean>}) {
  const c=useCreatorCopy(); const {locale}=useI18n();const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);const [read,setRead]=useState<string[]>([]);
  const labels:Record<string,CopyKey>={POLL_CREATED:"pollCreated",POLL_CLOSED:"pollClosed",NEW_VOTE:"newVote",SUGGESTION_RECEIVED:"suggestionReceived",SUGGESTION_APPROVED:"suggestionApproved",SUGGESTION_REJECTED:"suggestionRejected"};
  async function update(id?:string,open?:string) {
    setBusy(true);setError(null);
    try {await markRead(owner,id);setRead(old=>[...old,...(id?[id]:items.map(n=>n.id))]);if(!await refresh()) setError(c("savedRefresh"));if(open) router.push("/p/"+open);}
    catch {setError(c("notificationError"));}finally{setBusy(false);}
  }
  return <><h1 className="headline-pop text-3xl">{c("notifications")}</h1><Button variant="outline" disabled={busy||items.every(n=>n.is_read||read.includes(n.id))} onClick={()=>update()}>{c("markAll")}</Button>{error&&<p role="alert">{error}</p>}{!items.length&&<p>{c("noNotifications")}</p>}{items.map(n=><div key={n.id} className="card flex flex-col gap-2 p-4"><button className="text-left focus-visible:outline-2 focus-visible:outline-primary" disabled={busy} onClick={()=>update(n.id,n.poll_id)}><span className="text-sm font-semibold text-primary">{c(labels[n.type]??"notifications")}</span>{!n.is_read&&!read.includes(n.id)&&<span className="ml-2 rounded-full bg-mustard px-2 text-xs text-on-mustard">{c("unread")}</span>}<h2 className="mt-1 font-bold wrap-break-word">{n.poll_question}</h2>{n.detail&&<p className="mt-1 wrap-break-word">{n.detail}</p>}<time className="mt-2 block text-xs text-ink-muted" dateTime={n.created_at}>{new Date(n.created_at).toLocaleString(locale)}</time></button></div>)}</>;
}
function Account({polls}:{polls:CreatorPoll[]}) {
  const auth=useAuth(); const c=useCreatorCopy();const router=useRouter();const [error,setError]=useState<string|null>(null);const [busy,setBusy]=useState(false);
  async function logout(){setBusy(true);try{await auth.signOut();router.replace("/app/login");}catch{setError(c("actionError"));}finally{setBusy(false);}}
  async function share(){try{const url=window.location.origin;if(navigator.share) await navigator.share({title:"Pickle",url});else{await navigator.clipboard.writeText(url);setError(c("shareCopied"));}}catch(e){if((e as Error).name!=="AbortError") setError(c("shareFailed"));}}
  return <><h1 className="headline-pop text-3xl">{c("account")}</h1><div className="card flex flex-col items-center gap-4 p-6">{auth.profile.avatarUrl&&<img src={auth.profile.avatarUrl} alt="" width={80} height={80} className="rounded-full border-[1.5px] border-ink"/>}<h2 className="text-2xl font-bold">{auth.profile.displayName}</h2><p className="text-sm text-ink-muted">{auth.user?.email}</p><p>{c("pollsCount",{n:polls.length})} · {c("closedCount",{n:polls.filter(p=>!isPollOpen(p)).length})}</p><p className="text-sm text-ink-muted">{c("savedIdentity")}</p><Button variant="outline" onClick={auth.openProfile}>{c("profile")}</Button></div><Link href="/app/new" className={buttonClass()}>{c("newPoll")}</Link><Link href="/app/notifications" className={buttonClass("outline")}>{c("notifications")}</Link><Button variant="outline" onClick={share}>{c("shareApp")}</Button><Button variant="text" disabled={busy} onClick={logout}>{c("signOut")}</Button>{error&&<p role="status">{error}</p>}</>;
}
function Demo() {
  const c=useCreatorCopy();const search=useSearchParams();const id=search.get("poll");
  return <><div className="rounded-2xl border-[1.5px] border-ink bg-mustard p-4 text-on-mustard"><p>{c("demo")}</p><Link href="/app/signup" className={buttonClass("dark","mt-3 w-full")}>{c("saveDemo")}</Link></div><h1 className="headline-pop text-3xl">{c("tryDemo")}</h1>{id?<><h2 className="text-2xl font-bold">{id==="film"?"Film night: what are we watching?":"Pizza night: what are we ordering?"}</h2><LeaderCard text={id==="film"?"Arrival · Paddington 2":"Detroit-style from Emmy’s"} count={id==="film"?4:5} total={id==="film"?8:11} percent={id==="film"?50:45} margin={id==="film"?0:2} ribbon={id==="film"?"tie":"lead"}/><Link href="/app/demo" className={buttonClass("outline")}>{c("back")}</Link></>:<>{["pizza","film"].map(id=><Link href={"/app/demo?poll="+id} key={id} className="card p-5 font-bold">{c(id as "pizza"|"film")} →</Link>)}</>}</>;
}
