/* eslint-disable @next/next/no-img-element -- shared DiceBear profile SVGs */
"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { useCreatorCopy } from "@/features/creator/copy";
import { useCreatorData } from "@/features/creator/useCreatorData";
import { CheckIcon } from "@/components/icons";
import { Button, buttonClass } from "@/components/ui/Button";
import { ShareBar } from "@/features/polls/components/ShareBar";
import { AuthScreen } from "./AuthScreen";
import { CreatePoll } from "./CreatePoll";

import { Welcome } from "./Welcome";
import { Dashboard } from "./Dashboard";
import { Templates } from "./Templates";
import { Notifications } from "./Notifications";
import { Account } from "./Account";
import { Demo } from "./Demo";

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
