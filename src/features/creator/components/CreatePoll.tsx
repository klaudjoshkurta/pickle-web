"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import { useCreatorCopy } from "@/features/creator/copy";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { blankDraft, starterDraft, templateDraft, starterIds, newOption, validDraft, type Draft, type CreatorPoll, type PollTemplate, type StarterId } from "@/features/creator/model";
import { createPoll } from "@/features/creator/api";
import { isUuid } from "@/domain/polls/pollLogic";
import { Button, buttonClass } from "@/components/ui/Button";

export function readDraft(key:string, fallback:()=>Draft):Draft {
  try {
    const value=sessionStorage.getItem(key); if(!value) return fallback();
    const d=JSON.parse(value) as Draft;
    if(typeof d.question!=="string" || !Array.isArray(d.options) || !d.options.every(o=>typeof o.key==="string"&&typeof o.text==="string") || !isUuid(d.requestId) ||
      !["SINGLE","MULTIPLE"].includes(d.voting_mode) || typeof d.expectedVoters!=="string" || ![d.allow_suggestions,d.require_approval,d.show_results_before_voting,d.allow_vote_change,d.excludeWinner].every(v=>typeof v==="boolean") ||
      !Array.isArray(d.runnerUpTexts) || !Array.isArray(d.newTexts) || !(d.closesAt===null || typeof d.closesAt==="string"&&Number.isFinite(Date.parse(d.closesAt)))) return fallback();
    return d;
  } catch {return fallback();}
}
export function CreatePoll({owner,templates,polls}:{owner:string;templates:PollTemplate[];polls:CreatorPoll[]}) {
  const c=useCreatorCopy();const {locale}=useI18n();const router=useRouter();const search=useSearchParams();
  const questionId=useId();
  const seed=search.get("seed");const templateId=search.get("template");
  const key="pickle.creator.draft:"+owner+":"+(templateId??seed??"blank");
  const [initial]=useState(()=>{
    try {
      const init=()=>templateId?templateDraft(templates.find(t=>t.id===templateId)!,polls):seed&&starterIds.includes(seed as StarterId)?starterDraft(seed as StarterId,new Date(),locale):blankDraft();
      if(templateId&&!templates.some(t=>t.id===templateId)) throw Error();
      return {draft:readDraft(key,init),error:false};
    }catch{return {draft:blankDraft(),error:true};}
  });
  const [draft,setDraft]=useState(initial.draft);const [busy,setBusy]=useState(false);const inFlight=useRef(false);
  const [error,setError]=useState<string|null>(null);const [storageError,setStorageError]=useState(false);
  function persist(d:Draft){try{sessionStorage.setItem(key,JSON.stringify(d));}catch{setStorageError(true);}}
  function change(patch:Partial<Draft>){if(inFlight.current)return;const next={...draft,...patch,requestId:crypto.randomUUID()};setDraft(next);persist(next);setError(null);}
  function move(from:number,to:number){if(to<0||to>=draft.options.length)return;const next=[...draft.options];const [option]=next.splice(from,1);next.splice(to,0,option);change({options:next});}
  async function submit(e:React.FormEvent){
    e.preventDefault();if(inFlight.current)return;if(!validDraft(draft)){setError(c("invalidDraft"));return;}
    inFlight.current=true;setBusy(true);setError(null);persist(draft);
    try{const id=await createPoll(draft,owner);try{sessionStorage.removeItem(key);}catch{}router.push("/app/share?poll="+encodeURIComponent(id));}
    catch{setError(c("createError"));inFlight.current=false;setBusy(false);}
  }
  if(initial.error)return <div role="alert" className="card p-5"><p>{c("templateError")}</p><Link href="/app/templates" className={buttonClass("outline","mt-4")}>{c("back")}</Link></div>;
  const localDate=draft.closesAt?new Date(Date.parse(draft.closesAt)-new Date(draft.closesAt).getTimezoneOffset()*60000).toISOString().slice(0,16):"";
  return <form onSubmit={submit} className="poll-has-actions creator-editor flex flex-col gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/app" className="link">{c("cancel")}</Link><h1 className="text-xl font-bold">{c("newPoll")}</h1></div>
    {draft.title&&<div className="rounded-2xl border-[1.5px] border-ink bg-mustard p-4 text-on-mustard">↻ {draft.title}{draft.history&&<p className="mt-1 text-sm">{c("carried",{date:new Date(draft.history).toLocaleDateString(locale)})}</p>}</div>}
    <fieldset disabled={busy} className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-2 font-semibold"><label htmlFor={questionId}>{c("question")}</label><textarea id={questionId} className="field min-h-24 py-3 font-bold" value={draft.question} onChange={e=>change({question:e.target.value})} required/></div>
      <div className="flex flex-col gap-3">{draft.options.map((option,i)=><div key={option.key} className="flex flex-wrap items-center gap-2 rounded-xl" draggable={!busy} onDragStart={e=>e.dataTransfer.setData("text/plain",String(i))} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const from=Number(e.dataTransfer.getData("text/plain"));if(Number.isInteger(from))move(from,i);}}>
        <div className="flex min-w-0 flex-1 flex-col gap-1"><label className="sr-only" htmlFor={option.key}>{c("option",{n:i+1})}</label><input id={option.key} className="field min-w-0" value={option.text} onChange={e=>change({options:draft.options.map((o,j)=>j===i?{...o,text:e.target.value}:o)})} required/>
          {(draft.runnerUpTexts.includes(option.text)||draft.newTexts.includes(option.text))&&<span className="self-start rounded-full bg-primary-soft px-2 py-1 text-xs text-primary">{c(draft.runnerUpTexts.includes(option.text)?"runnerUp":"new")}</span>}</div>
        <div className="flex shrink-0 gap-1"><button type="button" className="creator-move" disabled={i===0} aria-label={c("up",{n:i+1})} onClick={()=>move(i,i-1)}>↑</button><button type="button" className="creator-move" disabled={i===draft.options.length-1} aria-label={c("down",{n:i+1})} onClick={()=>move(i,i+1)}>↓</button><button type="button" className="creator-move" disabled={draft.options.length<=2} aria-label={c("remove",{n:i+1})} onClick={()=>change({options:draft.options.filter((_,j)=>j!==i)})}>×</button></div>
      </div>)}</div>
      <Button variant="outline" className="w-full border-dashed text-primary" disabled={draft.options.length>=10} onClick={()=>change({options:[...draft.options,newOption()]})}>+ {c("addOption")}</Button>
      {draft.winnerText&&<label className="flex items-center justify-between gap-4"><span><span className="block font-bold">{c("excludeWinner")}</span><span className="text-sm text-ink-muted">{c("previousWinner",{name:draft.winnerText})}</span></span><input type="checkbox" role="switch" checked={draft.excludeWinner} disabled={!draft.excludeWinner&&draft.options.length<=2||draft.excludeWinner&&draft.options.length>=10} onChange={e=>change({excludeWinner:e.target.checked,options:e.target.checked?draft.options.filter(o=>o.text!==draft.winnerText):[...draft.options,newOption(draft.winnerText!)]})}/></label>}
      <fieldset className="card flex min-w-0 flex-col gap-4 p-4"><legend className="px-2 font-bold">{c("settings")}</legend>
        <label className="flex flex-col gap-2 font-semibold">{c("settings")}<select aria-label={c("settings")} value={draft.voting_mode} onChange={e=>change({voting_mode:e.target.value as Draft["voting_mode"]})} className="field"><option value="SINGLE">{c("single")}</option><option value="MULTIPLE">{c("multiple")}</option></select></label>
        <p className="font-semibold">{c("closing")}</p><div className="flex flex-wrap gap-2">{([["hour",1],["day",24],["threeDays",72],["week",168]] as const).map(([label,h])=><Button key={label} variant="outline" onClick={()=>change({closesAt:new Date(Date.now()+h*3600000).toISOString()})}>{c(label)}</Button>)}<Button variant="outline" onClick={()=>change({closesAt:null})}>{c("noDeadline")}</Button></div>
        <label className="flex flex-col gap-2">{c("custom")}<input type="datetime-local" value={localDate} className="field" onChange={e=>{const date=new Date(e.target.value);change({closesAt:e.target.value&&Number.isFinite(date.getTime())?date.toISOString():null});}}/></label>
        {([['allow_suggestions','suggestions'],['require_approval','approval'],['show_results_before_voting','resultsBefore'],['allow_vote_change','voteChanges']] as const).map(([field,label])=><label key={field} className="flex items-center justify-between gap-4"><span>{c(label)}</span><input type="checkbox" role="switch" checked={draft[field]} disabled={field==="require_approval"&&!draft.allow_suggestions} onChange={e=>change({[field]:e.target.checked})}/></label>)}
        <label className="flex flex-col gap-2">{c("expected")}<input inputMode="numeric" maxLength={4} value={draft.expectedVoters} onChange={e=>change({expectedVoters:e.target.value.replace(/\D/g,"").slice(0,4)})} className="field"/></label>
      </fieldset>
    </fieldset>
    {!validDraft(draft)&&<p className="text-sm text-ink-muted">{c("invalidDraft")}</p>}{error&&<p role="alert" className="text-danger">{error}</p>}
    <p className="text-sm text-ink-muted">{c(storageError?"deviceStorage":"draftRestored")}</p>
    <div className="poll-vote-actions"><Button className="w-full" type="submit" disabled={busy||!validDraft(draft)}>{c(busy?"creating":"create")}</Button></div>
    <Button variant="text" disabled={busy} onClick={()=>{try{sessionStorage.removeItem(key);}catch{}setDraft(blankDraft());router.push("/app");}}>{c("discard")}</Button>
  </form>;
}
