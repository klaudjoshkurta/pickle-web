/* eslint-disable @next/next/no-img-element -- shared DiceBear profile SVGs */
"use client";
import Link from "next/link";
import { useCreatorCopy } from "@/features/creator/copy";
import { buttonClass } from "@/components/ui/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import type { CreatorPoll } from "@/features/creator/model";
import { isPollOpen } from "@/domain/polls/pollLogic";
import { Button } from "@/components/ui/Button";

export function Account({polls}:{polls:CreatorPoll[]}) {
  const auth=useAuth(); const c=useCreatorCopy();const router=useRouter();const [error,setError]=useState<string|null>(null);const [busy,setBusy]=useState(false);
  async function logout(){setBusy(true);try{await auth.signOut();router.replace("/app/login");}catch{setError(c("actionError"));}finally{setBusy(false);}}
  async function share(){try{const url=window.location.origin;if(navigator.share) await navigator.share({title:"Pickle",url});else{await navigator.clipboard.writeText(url);setError(c("shareCopied"));}}catch(e){if((e as Error).name!=="AbortError") setError(c("shareFailed"));}}
  return <><h1 className="headline-pop text-3xl">{c("account")}</h1><div className="card flex flex-col items-center gap-4 p-6">{auth.profile.avatarUrl&&<img src={auth.profile.avatarUrl} alt="" width={80} height={80} className="rounded-full border-[1.5px] border-ink"/>}<h2 className="text-2xl font-bold">{auth.profile.displayName}</h2><p className="text-sm text-ink-muted">{auth.user?.email}</p><p>{c("pollsCount",{n:polls.length})} · {c("closedCount",{n:polls.filter(p=>!isPollOpen(p)).length})}</p><p className="text-sm text-ink-muted">{c("savedIdentity")}</p><Button variant="outline" onClick={auth.openProfile}>{c("profile")}</Button></div><Link href="/app/new" className={buttonClass()}>{c("newPoll")}</Link><Link href="/app/notifications" className={buttonClass("outline")}>{c("notifications")}</Link><Button variant="outline" onClick={share}>{c("shareApp")}</Button><Button variant="text" disabled={busy} onClick={logout}>{c("signOut")}</Button>{error&&<p role="status">{error}</p>}</>;
}
