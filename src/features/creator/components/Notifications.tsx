"use client";
import { useCreatorCopy } from "@/features/creator/copy";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { CopyKey } from "@/features/creator/copy";
import type { Activity } from "@/features/creator/model";
import { markRead } from "@/features/creator/api";
import { Button } from "@/components/ui/Button";

export function Notifications({items,owner,refresh}:{items:Activity[];owner:string;refresh:()=>Promise<boolean>}) {
  const c=useCreatorCopy(); const {locale}=useI18n();const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);const [read,setRead]=useState<string[]>([]);
  const labels:Record<string,CopyKey>={POLL_CREATED:"pollCreated",POLL_CLOSED:"pollClosed",NEW_VOTE:"newVote",SUGGESTION_RECEIVED:"suggestionReceived",SUGGESTION_APPROVED:"suggestionApproved",SUGGESTION_REJECTED:"suggestionRejected"};
  async function update(id?:string,open?:string) {
    setBusy(true);setError(null);
    try {await markRead(owner,id);setRead(old=>[...old,...(id?[id]:items.map(n=>n.id))]);if(!await refresh()) setError(c("savedRefresh"));if(open) router.push("/p/"+open);}
    catch {setError(c("notificationError"));}finally{setBusy(false);}
  }
  return <><h1 className="headline-pop text-3xl">{c("notifications")}</h1><Button variant="outline" disabled={busy||items.every(n=>n.is_read||read.includes(n.id))} onClick={()=>update()}>{c("markAll")}</Button>{error&&<p role="alert">{error}</p>}{!items.length&&<p>{c("noNotifications")}</p>}{items.map(n=><div key={n.id} className="card flex flex-col gap-2 p-4"><button className="text-left focus-visible:outline-2 focus-visible:outline-primary" disabled={busy} onClick={()=>update(n.id,n.poll_id)}><span className="text-sm font-semibold text-primary">{c(labels[n.type]??"notifications")}</span>{!n.is_read&&!read.includes(n.id)&&<span className="ml-2 rounded-full bg-mustard px-2 text-xs text-on-mustard">{c("unread")}</span>}<h2 className="mt-1 font-bold wrap-break-word">{n.poll_question}</h2>{n.detail&&<p className="mt-1 wrap-break-word">{n.detail}</p>}<time className="mt-2 block text-xs text-ink-muted" dateTime={n.created_at}>{new Date(n.created_at).toLocaleString(locale)}</time></button></div>)}</>;
}
