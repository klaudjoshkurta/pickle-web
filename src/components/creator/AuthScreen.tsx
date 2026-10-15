/* eslint-disable @next/next/no-img-element -- DiceBear SVG identity choices */
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { dicebearUrl, randomSeeds } from "@/lib/avatars";
import { useCreatorCopy } from "@/lib/creator/copy";
import { getSupabase } from "@/lib/supabase";
import { Button } from "../ui/Button";

export function safeReturn(value:string|null) {
  return value && /^\/(app(?:\/|\?|$)|p\/[0-9a-f-]+(?:\?|$))/i.test(value) && !value.includes("\\") ? value : "/app";
}
export function AuthScreen({signup}:{signup:boolean}) {
  const c=useCreatorCopy(); const auth=useAuth(); const router=useRouter(); const search=useSearchParams();
  const [step,setStep]=useState(0); const [name,setName]=useState(auth.profile.displayName??"");
  const [seeds,setSeeds]=useState(()=>randomSeeds()); const [avatar,setAvatar]=useState<string|null>(auth.profile.avatarUrl);
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false); const [error,setError]=useState<string|null>(null); const [message,setMessage]=useState<string|null>(null);
  const [finishing,setFinishing]=useState(Boolean(auth.user?.user_metadata.pickle_account_pending));
  const next=safeReturn(search.get("next"));
  useEffect(()=>{
    if(auth.user && !auth.user.is_anonymous && !auth.user.user_metadata.pickle_account_pending) router.replace(next);
  },[auth.user,next,router]);
  const fields=[c("name"),c("avatar"),c("email"),c("password")];
  async function submit(e:React.FormEvent) {
    e.preventDefault(); setError(null); setMessage(null);
    if(signup && !finishing) {
      if(step===0 && !name.trim()) return setError(c("nameError"));
      if(step===1 && !avatar) return setError(c("avatarError"));
      if(step===2 && !email.trim().includes("@")) return setError(c("emailError"));
      if(step<3) {setStep(step+1);return;}
    }
    if((signup||finishing) && password.length<6) return setError(c("passwordError"));
    setBusy(true);
    try {
      const sb=getSupabase();
      if(finishing) {
        const result=await sb.auth.getUser();
        if(result.error) throw result.error;
        if(!result.data.user?.email_confirmed_at || result.data.user.is_anonymous) {setError(c("verifyFirst"));return;}
        const result2=await sb.auth.updateUser({password,data:{pickle_account_pending:false}}); if(result2.error) throw result2.error;
        router.replace(next); return;
      }
      if(!signup) {
        const result=await sb.auth.signInWithPassword({email:email.trim(),password}); if(result.error) throw result.error;
        router.replace(result.data.user?.user_metadata.pickle_account_pending ? "/app/signup" : next);return;
      }
      const data={display_name:name.trim(),avatar_url:avatar};
      const emailRedirectTo=window.location.origin+"/app/signup?next="+encodeURIComponent(next);
      if(auth.user?.is_anonymous) {
        const result=await sb.auth.updateUser({email:email.trim(),data:{...data,pickle_account_pending:true}},{emailRedirectTo});
        if(result.error) throw result.error;
        setFinishing(true);setPassword("");setMessage(c("checkEmail"));return;
      }
      const result=await sb.auth.signUp({email:email.trim(),password,options:{data,emailRedirectTo}});
      if(result.error) throw result.error;
      if(result.data.session) router.replace(next); else setMessage(c("checkEmail"));
    } catch(err) {setError((err as {message?:string}).message || c("authError"));}
    finally {setBusy(false);}
  }
  return <section className="mx-auto w-full max-w-md">
    <form onSubmit={submit} className="flex flex-col gap-5">
      <h1 className="headline-pop text-3xl">{c(finishing?"finish":signup?"signUp":"signIn")}</h1>
      {!signup && auth.user?.is_anonymous && <p className="text-sm text-ink-muted">{c("switchWarning")}</p>}
      {finishing && <p>{c("finishHint")}</p>}
      {signup && !finishing && <p className="text-sm text-ink-muted">{step+1} / 4 · {fields[step]}</p>}
      {signup && !finishing && step===0 && <label className="flex flex-col gap-2 font-semibold">{c("name")}<input autoFocus autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)} maxLength={40} className="field"/></label>}
      {signup && !finishing && step===1 && <div><div className="mb-4 flex items-center justify-between"><p>{c("avatar")}</p><Button variant="outline" onClick={()=>{setSeeds(randomSeeds());setAvatar(null);setError(null);}}>{c("shuffle")}</Button></div>
        <div role="radiogroup" aria-label={c("avatar")} className="creator-avatars grid grid-cols-5 gap-3">
          {seeds.map((seed,i)=>{const url=dicebearUrl(seed);return <button key={seed} type="button" role="radio" aria-checked={avatar===url} aria-label={c("avatar")+" "+(i+1)} onClick={()=>{setAvatar(url);setError(null);}} className={"aspect-square overflow-hidden rounded-full border-[1.5px] border-ink focus-visible:outline-2 focus-visible:outline-primary "+(avatar===url?"ring-2 ring-mustard ring-offset-2":"")}><img src={url} alt="" width={56} height={56} className="w-full"/></button>;})}
        </div></div>}
      {(!signup || step===2) && !finishing && <label className="flex flex-col gap-2 font-semibold">{c("email")}<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} className="field"/></label>}
      {(!signup || step===3 || finishing) && <label className="flex flex-col gap-2 font-semibold">{c("password")}<input type="password" autoComplete={signup||finishing?"new-password":"current-password"} required minLength={signup||finishing?6:1} value={password} onChange={e=>setPassword(e.target.value)} className="field"/></label>}
      {error && <p role="alert" className="text-danger">{error}</p>}{message && <p role="status" className="rounded-xl bg-primary-soft p-4">{message}</p>}
      <Button type="submit" disabled={busy}>{busy?c("loading"):finishing?c("finish"):signup&&step<3?c("next"):c(signup?"signUp":"signIn")}</Button>
      {signup&&step>0&&!finishing&&<Button variant="text" disabled={busy} onClick={()=>{setStep(step-1);setError(null);}}>{c("back")}</Button>}
      <p className="text-center text-sm text-ink-muted">{c(signup?"already":"noAccount")} <Link className="link" href={(signup?"/app/login":"/app/signup")+"?next="+encodeURIComponent(next)}>{c(signup?"signIn":"signUp")}</Link></p>
    </form>
  </section>;
}
