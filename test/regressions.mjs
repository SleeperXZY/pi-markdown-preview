import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = resolve(process.cwd(), "index.ts");
const src = readFileSync(sourcePath, "utf-8");

assert.match(src, /function buildRenderCacheKey\s*\(/, "Missing buildRenderCacheKey helper.");
assert.match(
	src,
	/const cacheKey = buildRenderCacheKey\(style\.cacheKey,\s*resourcePath,\s*isLatex\)/,
	"renderPreview should scope cache by style/resourcePath/isLatex.",
);

assert.match(
	src,
	/markdown\+tex_math_dollars\+autolink_bare_uris-raw_html/,
	"HTML preview input format should disable raw HTML.",
);
assert.match(
	src,
	/markdown\+tex_math_dollars\+autolink_bare_uris\+superscript\+subscript-raw_html/,
	"PDF input format should disable raw HTML.",
);

assert.match(
	src,
	/resolvePath\(ctx\.cwd,\s*expanded\)/,
	"--file paths should resolve against ctx.cwd.",
);

assert.match(
	src,
	/if \(baseLower === "dockerfile"\) return "dockerfile";/,
	"Dockerfile basename detection should be supported.",
);
assert.match(
	src,
	/if \(baseLower === "makefile"\) return "makefile";/,
	"Makefile basename detection should be supported.",
);

assert.match(
	src,
	/function formatMarkdownImageDestination\s*\(/,
	"Missing markdown image destination formatter.",
);
assert.match(
	src,
	/formatMarkdownImageDestination\(path\)/,
	"Obsidian image normalization should use destination formatter.",
);

assert.match(
	src,
	/hasLikelyRelativeLocalImages\(effectiveMarkdown\)/,
	"Expected warning hook for likely unresolved relative images.",
);

console.log("Regression checks passed.");
