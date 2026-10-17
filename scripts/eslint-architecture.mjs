import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));
const relativeSource = (filename) => path.relative(sourceRoot, filename).split(path.sep).join("/");

export const architecture = {
  rules: {
    "import-boundaries": {
      meta: {
        type: "problem",
        schema: [],
        messages: { boundary: "{{from}} must not depend on {{to}}. Move composition into app or the owning feature." },
      },
      create(context) {
        const from = relativeSource(context.filename);
        function check(node) {
          const specifier = node.source?.value;
          if (typeof specifier !== "string") return;
          const target = specifier.startsWith("@/")
            ? path.join(sourceRoot, specifier.slice(2))
            : specifier.startsWith(".")
              ? path.resolve(path.dirname(context.filename), specifier)
              : null;
          if (!target) return;
          const to = relativeSource(target);
          const shared = from.startsWith("components/ui/") || from.startsWith("lib/");
          const forbidden =
            (shared && /^(app|features|domain)\//.test(to)) ||
            (from.startsWith("domain/") && /^(app|features|components|lib)\//.test(to)) ||
            (/^(features|components)\//.test(from) && to.startsWith("app/"));
          if (forbidden) context.report({ node: node.source, messageId: "boundary", data: { from, to } });
        }
        return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check, ImportExpression: check };
      },
    },
  },
};
