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
	/markdown\+lists_without_preceding_blankline-blank_before_blockquote-blank_before_header\+tex_math_dollars\+autolink_bare_uris-raw_html/,
	"HTML preview input format should allow lists, blockquotes, and headings without a preceding blank line and disable raw HTML.",
);
assert.match(
	src,
	/\["-f", inputFormat, "-t", "html5", "--mathml", "--wrap=none"\]/,
	"HTML preview should pass --wrap=none so long annotation markers survive pandoc wrapping.",
);
assert.match(
	src,
	/markdown\+lists_without_preceding_blankline-blank_before_blockquote-blank_before_header\+tex_math_dollars\+autolink_bare_uris\+superscript\+subscript-raw_html/,
	"PDF input format should allow lists, blockquotes, and headings without a preceding blank line and disable raw HTML.",
);
assert.ok(
	src.includes(String.raw`\\usepackage{soul}`),
	"PDF preamble should use soul for wrap-friendly annotation highlighting.",
);
assert.ok(
	src.includes(String.raw`\\hl{\\texttt{#1}}`),
	"PDF annotation macro should use highlight + texttt so long notes can wrap.",
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
	/const MARKDOWN_EXTENSIONS = new Set\(\["md", "markdown", "mdx", "rmd", "qmd"\]\);/,
	"Markdown extension detection should include .qmd files.",
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

assert.ok(
	src.includes(String.raw`const ANNOTATION_REGEX = /\\[an:\\s*([^\\]]+?)\\]/gi;`),
	"Browser annotation regex should allow embedded newlines inside [an: ...] markers.",
);
assert.ok(
	src.includes("https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"),
	"Browser/terminal preview should include a MathJax fallback loader for unsupported pandoc math.",
);
assert.match(
	src,
	/const renderMathFallback = async \(root\) =>/,
	"Expected targeted MathJax fallback for pandoc-unsupported preview equations.",
);

console.log("Regression checks passed.");
