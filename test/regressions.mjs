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
	src.includes(String.raw`\\usepackage{varwidth}`),
	"PDF preamble should use a varwidth annotation box so long notes wrap cleanly.",
);
assert.ok(
	src.includes(String.raw`\\newcommand{\\piannotation}[1]{\\begingroup\\setlength{\\fboxsep}{1.5pt}\\fcolorbox{PiAnnotationBorder}{PiAnnotationBg}`),
	"PDF annotation macro should use a boxed annotation style instead of raw soul highlighting.",
);
assert.ok(
	src.includes(String.raw`\\newcommand{\\PiDiffAddTok}[1]{\\textcolor{PiDiffAddText}{#1}}`),
	"PDF preamble should define dedicated diff add token colours.",
);
assert.ok(
	src.includes(String.raw`\\RecustomVerbatimEnvironment{Highlighting}{Verbatim}{commandchars=\\\\\\{\\},breaklines,breakanywhere}`),
	"PDF preamble should enable wrap-friendly highlighted verbatim blocks.",
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

assert.match(src, /function getLongestFenceRun\s*\(/, "Missing adaptive fence-length helper.");
assert.match(src, /function normalizeMarkdownFencedBlocks\s*\(/, "Missing fenced-block normalization helper.");
assert.match(
	src,
	/normalizeMarkdownFencedBlocks\(normalizeObsidianImages\(normalizeMathDelimiters\(markdown\)\)\)/,
	"Preview/browser paths should normalize fenced blocks before pandoc rendering.",
);
assert.match(
	src,
	/normalizeSubSupTags\(normalizeMarkdownFencedBlocks\(normalizeObsidianImages\(normalizeMathDelimiters\(markdown\)\)\)\)/,
	"PDF export should normalize fenced blocks before pandoc rendering.",
);
assert.match(
	src,
	/const markerLength = Math\.max\(3, \(markerChar === "`" \? maxBackticks : maxTildes\) \+ 1\);/,
	"Code-file wrapping should choose a fence longer than any inner fence run.",
);

assert.match(src, /function escapeLatexText\s*\(/, "Missing PDF annotation LaTeX escaping helper.");
assert.match(src, /function getMathPattern\s*\(/, "Missing shared PDF annotation math-pattern helper.");
assert.ok(
	src.includes(String.raw`return /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g;`),
	"PDF annotation escaping should preserve inline and display math segments.",
);
assert.match(
	src,
	/const cleaned = escapeLatexText\(trimmed\);/,
	"PDF annotation replacement should preserve renderable math instead of escaping it all as plain text.",
);

assert.match(src, /function decodeGeneratedLatexCodeText\s*\(/, "Missing generated-LaTeX code-text decode helper.");
assert.ok(
	src.includes('decodeGeneratedLatexCodeText') && src.includes('textbackslash') && src.includes('textasciitilde') && src.includes('textasciicircum'),
	"Diff annotation PDF rewrite should decode pandoc's escaped code-text sequences before preserving math.",
);
assert.match(src, /function convertMathToVerbatimSafeTeX\s*\(/, "Missing verbatim-safe math conversion helper for diff PDF annotations.");
assert.match(src, /function escapeLatexTextForVerbatimMath\s*\(/, "Missing verbatim-safe annotation escaping helper.");
assert.ok(src.includes('\\sb') && src.includes('\\sp'), "Verbatim-safe diff math should rewrite sub/superscripts via \\sb/\\sp.");
assert.match(src, /const markerText = escapeLatexTextForVerbatimMath\(decodedMarkerText\);/, "Diff token annotation rewrite should use the verbatim-safe math escape path.");
assert.match(src, /function replaceAnnotationMarkersInDiffTokenLine\s*\(/, "Missing diff-token annotation rewrite helper.");
assert.match(src, /function rewriteGeneratedDiffHighlighting\s*\(/, "Missing generated LaTeX diff rewrite helper.");
assert.match(src, /function renderMarkdownToPdfViaGeneratedLatex\s*\(/, "Missing generated-LaTeX PDF path for diff exports.");
assert.match(
	src,
	/hasMarkdownDiffFence\(markdownForPdf\)/,
	"PDF export should route diff-containing markdown through the generated-LaTeX rewrite path.",
);

assert.ok(
	src.includes(String.raw`const ANNOTATION_REGEX = /\\[an:\\s*([^\\]]+?)\\]/gi;`),
	"Browser annotation regex should support inline annotation markers.",
);
assert.ok(
	src.includes(String.raw`const ANNOTATION_HTML_REGEX = new RegExp('\\\\[an:\\\\s*([\\\\s\\\\S]*?)\\\\]', 'gi');`),
	"Browser preview should support rich-text annotation markers that span nested math/HTML nodes.",
);
assert.match(src, /const applyRichTextAnnotationMarkers = \(root\) =>/, "Missing rich-text annotation marker helper.");
assert.match(src, /const renderAnnotationMarkerMath = async \(root\) =>/, "Missing annotation-marker math rendering helper.");
assert.ok(
	src.includes(String.raw`const ANNOTATION_MATH_REGEX = new RegExp('\\\\$\\\\$([\\\\s\\\\S]*?)\\\\$\\\\$|\\\\$([^$\\\\n]+?)\\\\$', 'g');`),
	"Annotation-marker math rendering should detect dollar-delimited TeX inside preview chips.",
);
assert.match(src, /const decorateDiffCodeBlocks = \(root\) =>/, "Missing diff-preview decoration helper.");
assert.ok(src.includes("diff-add-line"), "Browser preview should classify added diff lines.");
assert.ok(src.includes("diff-del-line"), "Browser preview should classify deleted diff lines.");
assert.ok(src.includes("diff-header-line"), "Browser preview should classify diff header lines.");
assert.ok(src.includes("diff-meta-line"), "Browser preview should classify diff metadata lines.");
assert.ok(src.includes("diff-hunk-line"), "Browser preview should classify diff hunk lines.");
assert.ok(
	src.includes(String.raw`if (/^\\+(?!\\+\\+)/.test(text)) {`),
	"Browser diff styling should avoid misclassifying +++ header lines as added lines.",
);
assert.ok(
	src.includes(String.raw`} else if (/^-(?!--)/.test(text)) {`),
	"Browser diff styling should avoid misclassifying --- header lines as deleted lines.",
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
assert.match(
	src,
	/await renderMermaid\(\);\s*applyRichTextAnnotationMarkers\(root\);\s*decorateDiffCodeBlocks\(root\);\s*applyAnnotationMarkers\(root\);\s*await renderAnnotationMarkerMath\(root\);\s*await renderMathFallback\(root\);/s,
	"Browser preview should wrap rich-text annotations, decorate diffs, render annotation math, then run general math fallback.",
);

console.log("Regression checks passed.");
