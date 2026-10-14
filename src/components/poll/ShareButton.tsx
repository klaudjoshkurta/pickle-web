"use client";

import { pollShareUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

export function ShareButton({ pollId, question }: { pollId: string; question: string }) {
  const { t } = useI18n();
  const toast = useToast();

  async function share() {
    const url = pollShareUrl(pollId);
    const text = `${question}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast(t("linkCopied"));
    } catch {
      toast(t("copyFailed"));
    }
  }

  return (
    <Button variant="tonal" onClick={share} className="min-h-10 shrink-0 px-4 text-sm">
      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {t("share")}
    </Button>
  );
}
