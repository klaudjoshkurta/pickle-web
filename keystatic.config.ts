import { collection, config, fields } from "@keystatic/core";

const body = (label: string) => fields.markdoc({
  label,
  description: "Add the article body before publishing. Greek is used only when its title, summary, and body are complete.",
  options: {
    heading: [2, 3, 4],
    image: { directory: "public/images/blog", publicPath: "/images/blog/" },
  },
});

export default config({
  storage: { kind: "github", repo: "georgeshkurta13/pickle-web" },
  ui: { brand: { name: "Pickle" } },
  collections: {
    posts: collection({
      label: "Blog posts",
      slugField: "title",
      path: "src/content/posts/*",
      format: { data: "json" },
      columns: ["title", "publishedAt", "draft"],
      schema: {
        title: fields.slug({
          name: { label: "English title", validation: { isRequired: true } },
          slug: {
            label: "URL slug (shared by both languages)",
            validation: { pattern: { regex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "Use lowercase letters, numbers, and single hyphens." } },
          },
        }),
        publishedAt: fields.date({
          label: "Publication date",
          description: "Used for display and sorting, not scheduling.",
          validation: { isRequired: true },
        }),
        draft: fields.checkbox({ label: "Draft (hidden from the public blog)", defaultValue: true }),
        en: fields.object({
          summary: fields.text({ label: "Summary", multiline: true, validation: { isRequired: true } }),
          body: body("Body"),
        }, { label: "English" }),
        el: fields.object({
          title: fields.text({ label: "Title" }),
          summary: fields.text({ label: "Summary", multiline: true }),
          body: body("Body"),
        }, { label: "Greek (optional; English fallback)" }),
      },
    }),
  },
});
