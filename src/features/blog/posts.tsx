import "server-only";
import React from "react";
import Markdoc from "@markdoc/markdoc";
import { cacheLife } from "next/cache";
import { readPublishedPost, readPublishedSummaries, transformBody } from "./content";
import type { BlogPost } from "./types";

export async function getPublishedPosts() {
  "use cache";
  cacheLife("max");
  return readPublishedSummaries();
}

export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  "use cache";
  cacheLife("max");
  const post = await readPublishedPost(slug);
  if (!post) return null;
  return {
    ...post.summary,
    enBody: Markdoc.renderers.react(transformBody(post.en), React),
    elBody: post.el ? Markdoc.renderers.react(transformBody(post.el), React) : null,
  };
}
