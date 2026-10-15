"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LocaleContext";
import { selectTranslation, type BlogPost, type BlogPostSummary } from "@/lib/blog/types";
import { Header } from "@/components/Header";

function PostDate({ date, locale }: { date: string; locale: "en" | "el" }) {
  return <time dateTime={date} lang={locale}>{new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))}</time>;
}

export function BlogIndex({ posts }: { posts: BlogPostSummary[] }) {
  const { locale, t } = useI18n();
  return <>
    <Header landing />
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-10 pb-16 sm:px-6 sm:pt-16">
      <h1 className="headline-pop text-4xl sm:text-5xl">{t("navBlog")}</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-muted">{t("blogDescription")}</p>
      {posts.length === 0 ? <p className="card mt-10 p-8 text-ink-muted">{t("blogEmpty")}</p> :
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {posts.map((post) => {
            const translation = selectTranslation(post, locale);
            return <article key={post.slug} lang={translation.lang} className="card flex min-w-0 flex-col items-start p-6 sm:p-8">
              <p className="text-sm text-ink-muted"><PostDate date={post.publishedAt} locale={locale} /></p>
              <h2 className="mt-3 max-w-full text-2xl font-bold wrap-break-word"><Link href={`/blog/${post.slug}`} className="rounded hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{translation.title}</Link></h2>
              <p className="mt-4 max-w-full flex-1 leading-relaxed text-ink-muted wrap-break-word">{translation.summary}</p>
              <Link href={`/blog/${post.slug}`} lang={locale} className="link mt-6 inline-flex min-h-11 items-center gap-2" aria-label={`${t("blogReadArticle")}: ${translation.title}`}>{t("blogReadArticle")} <span aria-hidden="true">→</span></Link>
            </article>;
          })}
        </div>}
    </main>
  </>;
}

export function BlogArticle({ post }: { post: BlogPost }) {
  const { locale, t } = useI18n();
  const translation = selectTranslation(post, locale);
  return <>
    <Header landing />
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <Link href="/blog" className="link inline-flex min-h-11 items-center gap-2"><span aria-hidden="true">←</span>{t("blogBack")}</Link>
      <article lang={translation.lang} className="mt-8">
        <p className="text-sm text-ink-muted"><PostDate date={post.publishedAt} locale={locale} /></p>
        <h1 className="headline-pop mt-4 text-4xl leading-tight wrap-break-word sm:text-5xl">{translation.title}</h1>
        <p className="mt-6 text-xl leading-relaxed text-ink-muted wrap-break-word">{translation.summary}</p>
        <div className="blog-prose mt-10 border-t border-ink/15 pt-8">{translation.lang === "el" ? post.elBody : post.enBody}</div>
      </article>
    </main>
  </>;
}
