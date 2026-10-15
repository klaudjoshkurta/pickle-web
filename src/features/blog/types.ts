import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/translations";

export interface PostTranslation {
  title: string;
  summary: string;
}

export interface BlogPostSummary {
  slug: string;
  publishedAt: string;
  en: PostTranslation;
  el: PostTranslation | null;
}

export interface BlogPost extends BlogPostSummary {
  enBody: ReactNode;
  elBody: ReactNode;
}

export function selectTranslation<T extends { en: PostTranslation; el: PostTranslation | null }>(post: T, locale: Locale) {
  if (locale === "el" && post.el) return { ...post.el, lang: "el" as const };
  return { ...post.en, lang: "en" as const };
}

export function sortPosts<T extends { slug: string; publishedAt: string }>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.slug.localeCompare(b.slug));
}
