"use client";
import Link from "next/link";
import { useCreatorCopy } from "@/features/creator/copy";
import { buttonClass } from "@/components/ui/Button";

export function Welcome({pending}:{pending:boolean}) {
  const c=useCreatorCopy();
  return <section className="mx-auto flex w-full max-w-md flex-col gap-5 py-8"><h1 className="headline-pop text-4xl leading-tight">{c("welcome")}</h1><p className="text-ink-muted">{c("intro")}</p><p>{c("accountRequired")}</p><Link href="/app/signup" className={buttonClass()}>{c(pending?"finish":"signUp")}</Link><Link href="/app/login" className={buttonClass("outline")}>{c("signIn")}</Link><Link href="/app/demo" className={buttonClass("text")}>{c("tryDemo")}</Link></section>;
}
