import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdoc from "@markdoc/markdoc";
import { createPostReader, readPublishedPost, readPublishedSummaries, transformBody } from "./content";
import { selectTranslation } from "@/features/blog/types";

let root: string;
let reader: ReturnType<typeof createPostReader>;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "pickle-blog-test-"));
  reader = createPostReader(root);
});

afterEach(async () => { await rm(root, { recursive: true, force: true }); });

async function post(slug: string, options: { draft?: boolean; date?: string; greek?: "complete" | "partial"; body?: string } = {}) {
  const directory = join(root, "src/content/posts");
  await mkdir(join(directory, slug, "en"), { recursive: true });
  await mkdir(join(directory, slug, "el"), { recursive: true });
  await writeFile(join(directory, `${slug}.json`), JSON.stringify({
    title: `English ${slug}`,
    publishedAt: options.date ?? "2026-10-15",
    draft: options.draft ?? false,
    en: { summary: "English summary" },
    el: { title: options.greek ? "Ελληνικός τίτλος" : "", summary: options.greek ? "Ελληνική περίληψη" : "" },
  }));
  await writeFile(join(directory, slug, "en/body.mdoc"), options.body ?? "## A heading\n\nSome **bold** text and a [link](https://example.com).\n\n- First\n- Second\n");
  await writeFile(join(directory, slug, "el/body.mdoc"), options.greek === "complete" ? "## Νέα\n\nΤο ελληνικό άρθρο.\n" : "");
}

describe("published blog content", () => {
  it("supports a missing or empty collection", async () => {
    expect(await readPublishedSummaries(reader)).toEqual([]);
  });

  it("does not expose drafts, including their body or title", async () => {
    await post("private", { draft: true, body: "Draft secret" });
    await post("public");
    expect(await readPublishedPost("private", reader)).toBeNull();
    const summaries = await readPublishedSummaries(reader);
    expect(summaries.map((item) => item.slug)).toEqual(["public"]);
    expect(JSON.stringify(summaries)).not.toContain("private");
    expect(JSON.stringify(summaries)).not.toContain("Draft secret");
  });

  it("returns null for missing posts and invalid path segments", async () => {
    expect(await readPublishedPost("missing", reader)).toBeNull();
    for (const slug of ["../secret", "a/b", "%2e%2e", "A", "a--b"]) {
      expect(await readPublishedPost(slug, reader)).toBeNull();
    }
  });

  it("sorts newest first with slug ties, including future display dates", async () => {
    await post("b", { date: "2026-10-15" });
    await post("a", { date: "2026-10-15" });
    await post("old", { date: "2025-01-01" });
    await post("future", { date: "2099-01-01" });
    expect((await readPublishedSummaries(reader)).map((item) => item.slug)).toEqual(["future", "a", "b", "old"]);
  });

  it("uses English for absent or incomplete Greek translations", async () => {
    await post("english");
    await post("partial", { greek: "partial" });
    for (const slug of ["english", "partial"]) {
      const result = (await readPublishedPost(slug, reader))!;
      expect(result.el).toBeNull();
      expect(selectTranslation(result.summary, "el")).toEqual({ title: `English ${slug}`, summary: "English summary", lang: "en" });
    }
  });

  it("switches to complete Greek content and back to English", async () => {
    await post("bilingual", { greek: "complete" });
    const result = (await readPublishedPost("bilingual", reader))!;
    expect(result.el).not.toBeNull();
    expect(selectTranslation(result.summary, "el").title).toBe("Ελληνικός τίτλος");
    expect(selectTranslation(result.summary, "el").lang).toBe("el");
    expect(selectTranslation(result.summary, "en").title).toBe("English bilingual");
  });

  it("rejects a published article with an empty English body", async () => {
    await post("empty", { body: "\n\n" });
    await expect(readPublishedPost("empty", reader)).rejects.toThrow("complete English translation");
  });

  it("renders rich Markdoc on the server", async () => {
    await post("rich");
    const result = (await readPublishedPost("rich", reader))!;
    const html = renderToStaticMarkup(Markdoc.renderers.react(transformBody(result.en), React));
    expect(html).toContain("<h2>A heading</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('<a href="https://example.com">link</a>');
    expect(html).toContain("<li>First</li>");
  });
});
