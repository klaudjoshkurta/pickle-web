"use client";
import Link from "next/link";
import { useCreatorCopy } from "@/features/creator/copy";
import { buttonClass } from "@/components/ui/Button";
import { useSearchParams } from "next/navigation";
import { LeaderCard } from "@/features/polls/components/LeaderCard";

export function Demo() {
  const c=useCreatorCopy();const search=useSearchParams();const id=search.get("poll");
  return <><div className="rounded-2xl border-[1.5px] border-ink bg-mustard p-4 text-on-mustard"><p>{c("demo")}</p><Link href="/app/signup" className={buttonClass("dark","mt-3 w-full")}>{c("saveDemo")}</Link></div><h1 className="headline-pop text-3xl">{c("tryDemo")}</h1>{id?<><h2 className="text-2xl font-bold">{id==="film"?"Film night: what are we watching?":"Pizza night: what are we ordering?"}</h2><LeaderCard text={id==="film"?"Arrival · Paddington 2":"Detroit-style from Emmy’s"} count={id==="film"?4:5} total={id==="film"?8:11} percent={id==="film"?50:45} margin={id==="film"?0:2} ribbon={id==="film"?"tie":"lead"}/><Link href="/app/demo" className={buttonClass("outline")}>{c("back")}</Link></>:<>{["pizza","film"].map(id=><Link href={"/app/demo?poll="+id} key={id} className="card p-5 font-bold">{c(id as "pizza"|"film")} →</Link>)}</>}</>;
}
