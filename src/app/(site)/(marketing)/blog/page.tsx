import type { Metadata } from "next";
import { BlogIndex } from "@/features/blog/components/Blog";
import { getPublishedPosts } from "@/features/blog/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ideas, updates, and better ways to make plans with Pickle.",
};

export default async function BlogPage() {
  return <BlogIndex posts={await getPublishedPosts()} />;
}
