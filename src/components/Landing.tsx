"use client";

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
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-12 lg:pb-24">
      <div>
        <span className="pill bg-primary-soft text-primary-hover">
          <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
          {t("heroEyebrow")}
        </span>
        <h1 className="headline-pop mt-5 text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">{t("heroTitle")}</h1>
        <p className="mt-5 max-w-xl text-lg text-ink-muted">{t("heroBody")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("dark", "min-h-14 px-7 text-lg")}>
            <PlayIcon size={20} /> {t("ctaAndroid")}
          </a>
          <a href="#how" className={buttonClass("outline", "min-h-14 px-7 text-lg")}>
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
        />
      </div>
      <div className="relative mt-4 rotate-[0.6deg]">
        <ResultRows rows={rows} />
      </div>
      <div className="mt-4 flex justify-end">
        <span className="rounded-full border-2 border-ink bg-paper px-4 py-2">
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
        <img key={name} src={dicebearUrl(name)} alt="" width={40} height={40} className="h-10 w-10 rounded-full border-2 border-ink bg-surface-variant" />
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
    <section id="how" aria-labelledby="how-title" className="scroll-mt-6 border-y-2 border-ink bg-paper">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 id="how-title" className="headline-pop text-4xl sm:text-5xl">
          {t("howTitle")}
        </h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(([title, body, tone], i) => (
            <li key={title} className="card bg-cream p-6">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink font-display text-2xl font-bold ${tone}`}>
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">{t(title)}</h3>
              <p className="mt-2 text-ink-muted">{t(body)}</p>
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
      <ul className="mt-10 grid gap-5 sm:grid-cols-2">
        {features.map(([title, body, icon, tone]) => (
          <li key={title} className="card flex gap-4 p-6">
            <span aria-hidden className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink ${tone}`}>
              {icon}
            </span>
            <div>
              <h3 className="font-display text-xl font-bold">{t(title)}</h3>
              <p className="mt-1 text-ink-muted">{t(body)}</p>
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
      <div className="relative overflow-hidden rounded-4xl border-2 border-ink bg-tomato px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <span
          aria-hidden
          className="absolute top-8 -right-16 hidden w-64 rotate-38 sm:block border-y-2 border-ink bg-mustard py-2 font-display text-sm font-bold tracking-wider text-ink uppercase"
        >
          {t("winner")}
        </span>
        <h2 className="font-display text-4xl leading-tight font-bold [text-shadow:3px_3px_0_var(--color-ink)] sm:text-5xl">{t("ctaBandTitle")}</h2>
        <p className="mx-auto mt-3 max-w-md text-xl font-bold">{t("ctaBandBody")}</p>
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={buttonClass("dark", "mt-8 min-h-14 px-8 text-lg")}>
          <PlayIcon size={20} /> {t("ctaAndroid")}
        </a>
        <p className="mt-6">
          <span className="pill bg-tomato-deep text-white">{t("landingHint")}</span>
        </p>
      </div>
    </section>
  );
}

function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t-2 border-dashed border-surface-variant px-4 py-8 text-sm text-ink-muted sm:flex-row sm:px-6">
      <Wordmark />
      <p>{t("footerMadeWith")}</p>
    </footer>
  );
}
