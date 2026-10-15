"use client";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { useCreatorCopy } from "@/features/creator/copy";
import { closePoll, moderate, recordActivity, saveTemplate } from "@/features/creator/api";
import { nextWeekly, starterIds, type PollTemplate, type StarterId } from "@/features/creator/model";
import { getSupabase } from "@/lib/supabase";
import { isPollOpen, standing, voterCount } from "@/domain/polls/pollLogic";
import type { Poll, PollOption } from "@/domain/polls/types";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export function CreatorControls({poll,options,refetch,onClosed}:{poll:Poll;options:PollOption[];refetch:()=>Promise<boolean>;onClosed:()=>void}) {
  const auth=useAuth();const c=useCreatorCopy();const titleId=useId();
  const [endOpen,setEndOpen]=useState(false);const [templateOpen,setTemplateOpen]=useState(false);const [busy,setBusy]=useState(false);
  const [refreshNeeded,setRefreshNeeded]=useState(false);const [message,setMessage]=useState<string|null>(null);const [handled,setHandled]=useState<string[]>([]);
  const owner=auth.user?.id;
  if(!owner||owner!==poll.creator_id||auth.user?.is_anonymous||auth.user?.user_metadata.pickle_account_pending)return null;
  const open=isPollOpen(poll);const pending=options.filter(o=>o.status==="PENDING"&&!handled.includes(o.id));
  const approved=options.filter(o=>o.status==="APPROVED");const top=standing(poll,approved);
  async function refresh(){setBusy(true);const ok=await refetch();setRefreshNeeded(!ok);if(ok){setHandled([]);setMessage(null);}setBusy(false);}
  async function act(option:PollOption|null,approve=false){
    if(busy||refreshNeeded||!owner)return;setBusy(true);setMessage(null);
    try{
      if(option)await moderate(poll.id,option.id,approve,owner);else await closePoll(poll.id,owner);
    }catch{setMessage(c("actionError"));setBusy(false);return;}
    if(option)setHandled(old=>[...old,option.id]);else{onClosed();setEndOpen(false);}
    try{await recordActivity(owner,poll,option?approve?"SUGGESTION_APPROVED":"SUGGESTION_REJECTED":"POLL_CLOSED",option?.text??null);}catch{setMessage(c("activityError"));}
    const ok=await refetch();if(!ok){setRefreshNeeded(true);setMessage(c("savedRefresh"));}else setHandled([]);
    setBusy(false);
  }
  return <section aria-label={c("owner")} className="flex flex-col gap-3">
    <h2 className="font-bold">{c("owner")}</h2>
    {message&&<div role="status" className="card flex flex-wrap items-center gap-3 p-4"><p className="flex-1">{message}</p>{refreshNeeded&&<Button variant="outline" disabled={busy} onClick={refresh}>{c("refresh")}</Button>}</div>}
    {open&&pending.length>0&&<div className="card flex flex-col gap-4 p-4"><h3 className="font-bold">{c("moderate")}</h3>{pending.map(o=><div key={o.id} className="flex flex-col gap-2 border-t border-surface-variant pt-3"><p className="font-semibold wrap-break-word">{o.text}</p><div className="flex flex-wrap gap-2"><Button disabled={busy||refreshNeeded} onClick={()=>act(o,true)}>{c("approve")}</Button><Button variant="outline" disabled={busy||refreshNeeded} onClick={()=>act(o,false)}>{c("reject")}</Button></div></div>)}</div>}
    <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={busy||refreshNeeded} onClick={()=>setTemplateOpen(true)}>{c("saveTemplate")}</Button>{open&&<Button variant="outline" disabled={busy||refreshNeeded} onClick={()=>setEndOpen(true)}>{c("end")}</Button>}</div>
    <Dialog open={endOpen} onClose={()=>{if(!busy)setEndOpen(false);}} labelledBy={titleId}>
      <h2 id={titleId} className="text-2xl font-extrabold">{c("endTitle")}</h2><p className="mt-3 text-ink-muted">{c("endHint")}</p>
      <div className="my-5 rounded-xl bg-surface-variant p-4"><p>{c("votes",{n:voterCount(poll,approved)})}</p><p className="font-bold">{top.kind==="leader"?top.option.text+" · "+c("ahead",{n:top.margin}):top.kind==="tie"?c("tied",{n:top.options[0].vote_count}):c("noVotes")}</p></div>
      <Button className="w-full" disabled={busy} onClick={()=>act(null)}>{c("endConfirm")}</Button><Button variant="outline" className="mt-3 w-full" disabled={busy} onClick={()=>setEndOpen(false)}>{c("keepOpen")}</Button>
      {message&&<p role="alert" className="mt-3 text-danger">{message}</p>}
    </Dialog>
    {templateOpen&&<SaveTemplate poll={poll} owner={owner} onClose={()=>setTemplateOpen(false)} refetch={refetch}/>}
  </section>;
}
function SaveTemplate({poll,owner,onClose,refetch}:{poll:Poll;owner:string;onClose:()=>void;refetch:()=>Promise<boolean>}){
  const c=useCreatorCopy();const {locale}=useI18n();const title=useId();
  const [name,setName]=useState(poll.question.slice(0,80));const [icon,setIcon]=useState<StarterId>("film");
  const [weekly,setWeekly]=useState(false);const [weekday,setWeekday]=useState(5);const [time,setTime]=useState("20:00");const [zone,setZone]=useState(()=>Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);const [saved,setSaved]=useState(false);const [refreshNeeded,setRefreshNeeded]=useState(false);
  const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true;
    (async()=>{
      const sb=getSupabase();let query=sb.from("poll_templates").select("*").eq("owner_id",owner);
      query=poll.template_id?query.eq("id",poll.template_id):query.eq("source_poll_id",poll.id);
      const result=await query.maybeSingle<PollTemplate>();
      if(result.error)throw result.error;
      if(!active)return;
      const t=result.data;
      if(t){setName(t.name);setIcon(t.icon);setWeekly(t.schedule_weekday!==null);setWeekday(t.schedule_weekday??5);setTime(t.schedule_time?.slice(0,5)??"20:00");setZone(t.timezone);}
      setError(null);setLoading(false);
    })().catch(()=>{if(active)setError("load");});
    return ()=>{active=false;};
  },[owner,poll.id,poll.template_id,attempt]);
  async function submit(e:React.FormEvent){
    e.preventDefault();if(busy||saved)return;
    try{if(!name.trim()||name.length>80)throw Error();new Intl.DateTimeFormat("en",{timeZone:zone}).format();if(weekly)nextWeekly(weekday,time,zone);}catch{setError(c("scheduleError"));return;}
    setBusy(true);setError(null);
    try{await saveTemplate(poll.id,{name,icon,weekday:weekly?weekday:null,time:weekly?time:null,timezone:zone},owner);setSaved(true);setRefreshNeeded(!await refetch());}
    catch{setError(c("actionError"));}finally{setBusy(false);}
  }
  return <Dialog open onClose={()=>{if(!busy)onClose();}} labelledBy={title}><form onSubmit={submit} className="flex flex-col gap-4"><h2 id={title} className="text-2xl font-extrabold">{c("saveTemplate")}</h2>
    {loading?<><p>{c("loading")}</p>{error&&<><p role="alert">{c("loadError")}</p><Button onClick={()=>setAttempt(n=>n+1)}>{c("retry")}</Button></>}</>:saved?<><p role="status">{c(refreshNeeded?"savedRefresh":"templateSaved")}</p>{refreshNeeded&&<Button onClick={async()=>setRefreshNeeded(!await refetch())}>{c("refresh")}</Button>}</>:<>
      <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4"><label className="flex flex-col gap-2">{c("templateName")}<input className="field" value={name} maxLength={80} required onChange={e=>setName(e.target.value)}/></label>
        <label className="flex flex-col gap-2">{c("icon")}<select className="field" value={icon} onChange={e=>setIcon(e.target.value as StarterId)}>{starterIds.map(id=><option key={id} value={id}>{c(id)}</option>)}</select></label>
        <label className="flex items-center justify-between gap-3">{c("weekly")}<input type="checkbox" role="switch" checked={weekly} onChange={e=>setWeekly(e.target.checked)}/></label>
        {weekly&&<><label className="flex flex-col gap-2">{c("weekday")}<select className="field" value={weekday} onChange={e=>setWeekday(Number(e.target.value))}>{[1,2,3,4,5,6,7].map(day=><option key={day} value={day}>{new Intl.DateTimeFormat(locale,{weekday:"long",timeZone:"UTC"}).format(new Date(Date.UTC(2026,9,11+day)))}</option>)}</select></label><label className="flex flex-col gap-2">{c("localTime")}<input className="field" type="time" value={time} required onChange={e=>setTime(e.target.value)}/></label></>}
        <label className="flex flex-col gap-2">{c("timezone")}<input className="field" value={zone} required onChange={e=>setZone(e.target.value)}/></label>
      </fieldset>{error&&<p role="alert" className="text-danger">{error}</p>}<Button type="submit" disabled={busy}>{c("save")}</Button>
    </>}
    <Button variant="text" disabled={busy} onClick={onClose}>{c(saved?"back":"cancel")}</Button>
  </form></Dialog>;
}
