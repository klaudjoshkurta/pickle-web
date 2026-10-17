import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/Blog";
import { getPublishedPost, getPublishedPosts } from "@/features/blog/server/posts";

// Wait for the complete static result, including a real 404 for unpublished slugs.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  // Cache Components requires a validation path even for an empty collection.
  // Underscores cannot be a post slug, so this path always reaches notFound().
  return posts.length ? posts.map(({ slug }) => ({ slug })) : [{ slug: "__empty__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  return {
    title: post.en.title,
    description: post.en.summary,
    openGraph: { type: "article", title: post.en.title, description: post.en.summary, publishedTime: `${post.publishedAt}T00:00:00Z` },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  return <BlogArticle post={post} />;
}
