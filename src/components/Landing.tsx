"use client";
import Link from "next/link";

import { dicebearUrl } from "@/lib/avatars";
import { PLAY_STORE_URL } from "@/lib/config";
import { useI18n } from "@/lib/i18n/LocaleContext";
import type { MessageKey } from "@/lib/i18n/translations";
import { percentOf } from "@/lib/pollLogic";
import { BoltIcon, CheckIcon, PlayIcon, ScaleIcon, SparkIcon, UserIcon } from "./icons";
import { Header } from "./Header";
import { Wordmark } from "./Logo";
import { LeaderCard } from "./poll/LeaderCard";
import { ResultRows } from "./poll/ResultRows";
import { LiveIndicator } from "./poll/ResultsFooter";
import { buttonClass } from "./ui/Button";

const DEMO_VOTES = [5, 3, 2, 1];
const DEMO_TOTAL = DEMO_VOTES.reduce((a, b) => a + b, 0);
const CREW = ["Priya", "Jonah", "Sam", "Mara"];

export function Landing() {
  return (
    <>
      <Header landing />
      <main className="flex flex-1 flex-col">
        <Hero />
        <HowItWorks />
        <Features />
        <ClosingCta />
        <SiteFooter />
      </main>
    </>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-14 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-16 lg:pb-28">
      <div>
        <span className="pill bg-primary-soft text-primary-hover">
          <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
          {t("heroEyebrow")}
        </span>
        <h1 className="headline-pop mt-5 text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">{t("heroTitle")}</h1>
        <p className="mt-5 max-w-xl text-lg text-ink-muted">{t("heroBody")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/create" className={buttonClass("primary", "min-h-14 px-7 text-lg")}>{t("createPoll")}</Link>
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("dark", "min-h-14 px-7 text-lg")}>
            <PlayIcon size={20} /> {t("ctaAndroid")}
          </a>
          <a href="#how" className={buttonClass("text", "min-h-14 px-7 text-lg")}>
            {t("ctaHow")}
          </a>
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm font-medium text-ink-muted">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
            <CheckIcon size={12} />
          </span>
          {t("heroNote")}
        </p>
      </div>
      <DemoPoll />
    </section>
  );
}

/** A static, decorative poll built from the real result components. */
function DemoPoll() {
  const { t } = useI18n();
  const texts: MessageKey[] = ["demoOption1", "demoOption2", "demoOption3", "demoOption4"];
  const rows = texts.slice(1).map((key, i) => ({
    id: key,
    text: t(key),
    count: DEMO_VOTES[i + 1],
    percent: percentOf(DEMO_VOTES[i + 1], DEMO_TOTAL),
    isMine: i === 0,
  }));

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-xl select-none">
      <div className="mb-4 flex items-center gap-3">
        <AvatarStack />
        <p className="font-display text-lg leading-tight font-bold">{t("demoQuestion")}</p>
      </div>
      <div className="relative -rotate-1 transition-transform duration-500 hover:rotate-0 motion-reduce:transition-none">
        <LeaderCard
          text={t("demoOption1")}
          count={DEMO_VOTES[0]}
          total={DEMO_TOTAL}
          percent={percentOf(DEMO_VOTES[0], DEMO_TOTAL)}
          margin={DEMO_VOTES[0] - DEMO_VOTES[1]}
          ribbon="lead"
          appearance="soft"
        />
      </div>
      <div className="relative mt-4 rotate-[0.6deg]">
        <ResultRows rows={rows} appearance="soft" />
      </div>
      <div className="mt-4 flex justify-end">
        <span className="px-2 py-1">
          <LiveIndicator />
        </span>
      </div>
    </div>
  );
}

function AvatarStack() {
  return (
    <span className="flex shrink-0 -space-x-3">
      {CREW.map((name) => (
        // eslint-disable-next-line @next/next/no-img-element -- remote SVG avatars
        <img key={name} src={dicebearUrl(name)} alt="" width={40} height={40} className="h-10 w-10 rounded-full border-2 border-cream bg-surface-variant" />
      ))}
    </span>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  const steps: [MessageKey, MessageKey, string][] = [
    ["step1Title", "step1Body", "bg-mustard"],
    ["step2Title", "step2Body", "bg-primary-soft"],
    ["step3Title", "step3Body", "bg-tomato text-white"],
  ];
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-6 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 id="how-title" className="headline-pop text-4xl sm:text-5xl">
          {t("howTitle")}
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
          {steps.map(([title, body, tone], i) => (
            <li key={title} className="max-w-sm">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full font-display text-2xl font-bold ${tone}`}>
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">{t(title)}</h3>
              <p className="mt-3 leading-relaxed text-ink-muted">{t(body)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useI18n();
  const features: [MessageKey, MessageKey, React.ReactNode, string][] = [
    ["feature1Title", "feature1Body", <UserIcon key="u" size={22} />, "bg-primary-soft text-primary-hover"],
    ["feature2Title", "feature2Body", <BoltIcon key="b" size={22} />, "bg-mustard text-ink"],
    ["feature3Title", "feature3Body", <SparkIcon key="s" size={22} />, "bg-tomato text-white"],
    ["feature4Title", "feature4Body", <ScaleIcon key="c" size={22} />, "bg-surface-variant text-ink"],
  ];
  return (
    <section aria-labelledby="features-title" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <h2 id="features-title" className="headline-pop text-4xl sm:text-5xl">
        {t("featuresTitle")}
      </h2>
      <ul className="mt-12 grid gap-x-16 gap-y-10 sm:grid-cols-2">
        {features.map(([title, body, icon, tone]) => (
          <li key={title} className="flex gap-4">
            <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
              {icon}
            </span>
            <div>
              <h3 className="font-display text-xl font-bold">{t(title)}</h3>
              <p className="mt-2 max-w-md leading-relaxed text-ink-muted">{t(body)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClosingCta() {
  const { t } = useI18n();
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <div className="relative overflow-hidden rounded-4xl bg-tomato px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <span
          aria-hidden
          className="absolute top-8 -right-16 hidden w-64 rotate-38 sm:block bg-mustard py-2 font-display text-sm font-bold tracking-wider text-ink uppercase"
        >
          {t("winner")}
        </span>
        <h2 className="font-display text-4xl leading-tight font-bold sm:text-5xl">{t("ctaBandTitle")}</h2>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed">{t("ctaBandBody")}</p>
        <Link href="/create" className={buttonClass("primary", "mt-8 min-h-14 px-8 text-lg")}>{t("createPoll")}</Link>
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("dark", "mt-8 min-h-14 px-8 text-lg")}>
          <PlayIcon size={20} /> {t("ctaAndroid")}
        </a>
        <p className="mt-6 text-sm">{t("landingHint")}</p>
      </div>
    </section>
  );
}

function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:px-6">
      <Wordmark />
      <p>{t("footerMadeWith")}</p>
    </footer>
  );
}
