import Markdoc from "@markdoc/markdoc";
import { createReader } from "@keystatic/core/reader";
import type { Entry } from "@keystatic/core/reader";
import config from "../../../../keystatic.config";
import { sortPosts, type BlogPostSummary } from "@/features/blog/types";

export type PostEntry = Entry<typeof config.collections.posts>;
type BodyNode = Awaited<ReturnType<PostEntry["en"]["body"]>>["node"];

export function createPostReader(root: string) {
  return createReader(root, config).collections.posts;
}

function hasContent(node: BodyNode): boolean {
  return Boolean(
    (typeof node.attributes.content === "string" && node.attributes.content.trim()) ||
    node.type === "image" ||
    node.children.some(hasContent),
  );
}

export async function readPublishedPost(slug: string, reader = createPostReader(process.cwd())) {
  // Validate before passing user-controlled route params to the filesystem reader.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const entry = await reader.read(slug);
  if (!entry || entry.draft) return null;

  const en = await entry.en.body();
  if (!entry.title.trim() || !entry.en.summary.trim() || !hasContent(en.node)) {
    throw new Error(`Published blog post "${slug}" needs a complete English translation.`);
  }
  let el: Awaited<ReturnType<PostEntry["el"]["body"]>> | null = null;
  if (entry.el.title.trim() && entry.el.summary.trim()) {
    const candidate = await entry.el.body();
    if (hasContent(candidate.node)) el = candidate;
  }

  const summary: BlogPostSummary = {
    slug,
    publishedAt: entry.publishedAt,
    en: { title: entry.title, summary: entry.en.summary },
    el: el ? { title: entry.el.title, summary: entry.el.summary } : null,
  };
  return { summary, en: en.node, el: el?.node ?? null };
}

export async function readPublishedSummaries(reader = createPostReader(process.cwd())) {
  const posts = await Promise.all((await reader.list()).map((slug) => readPublishedPost(slug, reader)));
  return sortPosts(posts.flatMap((post) => post ? [post.summary] : []));
}

export function transformBody(node: BodyNode) {
  const errors = Markdoc.validate(node);
  if (errors.some(({ error }) => error.level === "critical" || error.level === "error")) {
    throw new Error("Invalid Markdoc in a published blog article.");
  }
  return Markdoc.transform(node);
}
