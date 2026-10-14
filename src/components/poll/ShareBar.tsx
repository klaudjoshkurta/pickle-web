"use client";

import { pollShareUrl } from "@/lib/config";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { CopyIcon, ShareIcon } from "../icons";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

/** Tan pill from the design: the public link plus a share / copy action. */
export function ShareBar({ pollId, question, closed }: { pollId: string; question: string; closed: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const url = pollShareUrl(pollId);
  // PollView only renders in the browser, so navigator is available here.
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function share() {
    const text = `${question}\n${url}`;
    if (canShare) {
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
    <div className="flex flex-col gap-3 rounded-[1.75rem] bg-surface-variant p-3 pl-5 sm:flex-row sm:items-center sm:rounded-full">
      <p className="min-w-0 flex-1 text-sm text-ink-muted">
        {t(closed ? "shareLeadClosed" : "shareLead")}{" "}
        <span className="block truncate font-semibold text-ink" title={url}>
          {url.replace(/^https?:\/\//, "")}
        </span>
      </p>
      <Button variant="dark" onClick={share} className="shrink-0">
        {canShare ? <ShareIcon size={18} /> : <CopyIcon size={18} />}
        {canShare ? t("share") : t("copyLink")}
      </Button>
    </div>
  );
}
