import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = resolve(process.cwd(), "index.ts");
const src = readFileSync(sourcePath, "utf-8");
const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf-8"));

assert.equal(packageJson.version, "0.10.0", "Package version should track upstream v0.10.0.");
assert.equal(packageJson.dependencies.mathjax, "^3.2.2", "Local MathJax must remain a runtime dependency.");
assert.equal(packageJson.peerDependencies.typebox, "*", "The upstream preview_export schema requires the bundled TypeBox peer.");
assert.match(src, /const RENDER_VERSION = "v22";/, "Rendering changes should invalidate older cached artifacts.");
assert.match(src, /function buildRenderCacheKey\s*\(/, "Missing buildRenderCacheKey helper.");
assert.match(
	src,
	/const DEFAULT_TERMINAL_PREVIEW_FONT_SIZE_PX = 16;/,
	"Terminal preview should keep the known-good crisp default font size.",
);
assert.match(
	src,
	/const DEFAULT_BROWSER_PREVIEW_FONT_SIZE_PX = 15;/,
	"Browser preview default font size should match Studio's compact markdown rendering.",
);
assert.match(
	src,
	/const DEFAULT_TERMINAL_DEVICE_SCALE_FACTOR = 2;/,
	"Terminal preview should keep the known-good screenshot density.",
);
assert.match(
	src,
	/const cacheKey = buildRenderCacheKey\(`\$\{style\.cacheKey\}\|fontSize=\$\{previewFontSizePx\}\|scale=\$\{deviceScaleFactor\}`,[\s\S]*?resourcePath,[\s\S]*?isLatex\)/,
	"renderPreview should scope cache by style/resourcePath/isLatex/fontSize/deviceScaleFactor.",
);

assert.match(
	src,
	/markdown\+lists_without_preceding_blankline-blank_before_blockquote-blank_before_header\+tex_math_dollars\+autolink_bare_uris-raw_html/,
	"HTML preview input format should allow lists, blockquotes, and headings without a preceding blank line and disable raw HTML.",
);
assert.match(
	src,
	/\["-f", inputFormat, "-t", "html5", mathRenderer === "mathjax" \? "--mathjax" : "--mathml", "--wrap=none"\]/,
	"HTML preview should choose MathJax or MathML output and pass --wrap=none so long annotation markers survive pandoc wrapping.",
);
assert.match(
	src,
	/markdown\+lists_without_preceding_blankline-blank_before_blockquote-blank_before_header\+tex_math_dollars\+autolink_bare_uris\+superscript\+subscript-raw_html/,
	"PDF input format should allow lists, blockquotes, and headings without a preceding blank line and disable raw HTML.",
);
assert.ok(
	src.includes(String.raw`\\IfFileExists{titlesec.sty}`) && src.includes(String.raw`\\IfFileExists{enumitem.sty}`),
	"PDF preamble should make cosmetic heading/list packages optional.",
);
assert.ok(
	src.includes(String.raw`\\IfFileExists{ctex.sty}`) &&
		src.includes(String.raw`\\setCJKsansfont{Noto Sans CJK SC}`) &&
		src.includes(String.raw`\\ifcsname ctexset\\endcsname`),
	"Fork CJK support should remain optional and preserve CJK-aware heading formatting.",
);
assert.ok(
	src.includes(String.raw`\\IfFileExists{varwidth.sty}`) && src.includes(String.raw`\\parbox{\\dimexpr\\linewidth-2\\fboxsep-2\\fboxrule\\relax}`),
	"PDF annotation boxes should use varwidth when available and a parbox fallback otherwise.",
);
assert.ok(
	src.includes(String.raw`\\newcommand{\\piannotation}[1]{%`) && src.includes(String.raw`\\fcolorbox{PiAnnotationBorder}{PiAnnotationBg}{%`),
	"PDF annotation macro should use a boxed annotation style instead of raw soul highlighting.",
);
assert.ok(
	src.includes(String.raw`\\newcommand{\\PiDiffAddTok}[1]{\\textcolor{PiDiffAddText}{#1}}`),
	"PDF preamble should define dedicated diff add token colours.",
);
assert.ok(
	src.includes(String.raw`\\IfFileExists{framed.sty}`) &&
		src.includes(String.raw`\\definecolor{shadecolor}{HTML}{F6F8FA}`) &&
		src.includes(String.raw`\\renewenvironment{Shaded}{\\begin{snugshade}}{\\end{snugshade}}`),
	"PDF preamble should add a light code-block background when framed is available.",
);
assert.ok(
	src.includes(String.raw`\\IfFileExists{fvextra.sty}`) && src.includes(String.raw`\\RecustomVerbatimEnvironment{Highlighting}{Verbatim}{commandchars=\\\\\\{\\},breaklines,breakanywhere}`),
	"PDF preamble should enable wrap-friendly highlighted verbatim blocks when fvextra is available.",
);
assert.ok(
	src.includes("--pdf-engine-opt=-interaction=nonstopmode") && src.includes("--pdf-engine-opt=-halt-on-error"),
	"PDF export should pass non-interactive LaTeX engine options when using LaTeX engines.",
);
assert.match(
	src,
	/child\.stdout\.on\("data", \(chunk: Buffer \| string\) => \{\s*stdoutChunks\.push/s,
	"PDF subprocess stdout should be drained so verbose LaTeX output cannot block the command.",
);
assert.ok(
	src.includes("PI_MARKDOWN_PREVIEW_PDF_TIMEOUT_MS") && src.includes("pandoc PDF export timed out"),
	"PDF export should have a configurable timeout instead of hanging indefinitely.",
);

assert.match(
	src,
	/resolvePath\(ctx\.cwd,\s*expanded\)/,
	"--file paths should resolve against ctx.cwd.",
);
assert.match(
	src,
	/const withoutAtPrefix = rawPath\.startsWith\("@"\) \? rawPath\.slice\(1\) : rawPath;/,
	"Tool and command paths should retain upstream leading-@ normalization.",
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
	/resourcePath = ctx\.cwd;/,
	"Assistant-response previews should resolve relative local images against ctx.cwd.",
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

assert.match(src, /from "\.\/shared\/annotation-scanner\.js"/, "Markdown preview should import the shared annotation scanner.");
assert.match(src, /const PREVIEW_ANNOTATION_PLACEHOLDER_PREFIX = "PIMDPREVIEWANNOT";/, "Missing browser preview annotation placeholder prefix.");
assert.match(src, /const ANNOTATION_HELPERS_SOURCE = readFileSync\(new URL\("\.\/client\/annotation-helpers\.js", import\.meta\.url\), "utf-8"\);/, "Browser preview should embed the annotation helper script.");
assert.match(src, /function prepareBrowserPreviewMarkdown\s*\(/, "Missing browser preview annotation preparation helper.");
assert.match(src, /prepareMarkdownForPandocPreview\(normalizedMarkdown, PREVIEW_ANNOTATION_PLACEHOLDER_PREFIX\)/, "Browser preview should replace prose annotations with placeholders before pandoc.");
assert.match(src, /buildBrowserHtmlFromPandocFragment\(fragmentHtml, style, resourcePath, annotationPlaceholders[\s\S]*?\)/, "Browser preview HTML builder should receive annotation placeholders.");

assert.match(src, /function escapeLatexText\s*\(/, "Missing PDF annotation LaTeX escaping helper.");
assert.match(src, /function getMathPattern\s*\(/, "Missing shared PDF annotation math-pattern helper.");
assert.ok(
	src.includes(String.raw`return /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\$([^$\n]+?)\$/g;`),
	"PDF annotation escaping should preserve inline and display math segments.",
);
assert.match(src, /function renderAnnotationPdfLatex\s*\(/, "Missing markdown-ish PDF annotation renderer.");
assert.match(src, /function renderAnnotationCodeSpanPdfLatex\s*\(/, "Missing PDF annotation code-span renderer.");
assert.match(src, /function renderAnnotationPlainTextPdfLatex\s*\(/, "Missing PDF annotation emphasis renderer.");
assert.match(src, /const cleaned = renderAnnotationPdfLatex\(marker\.body\);/, "PDF prose annotation replacement should use the markdown-ish annotation renderer.");
assert.match(src, /return transformMarkdownOutsideFences\(markdown, \(segment(?::\s*string)?\) => replaceAnnotationMarkersForPdfInSegment\(segment\)\);/, "PDF prose annotation replacement should transform only markdown outside fences.");

assert.match(src, /function decodeGeneratedLatexCodeText\s*\(/, "Missing generated-LaTeX code-text decode helper.");
assert.ok(
	src.includes("decodeGeneratedLatexCodeText")
		&& src.includes("textbackslash")
		&& src.includes("textasciigrave")
		&& src.includes("textasciitilde")
		&& src.includes("textasciicircum")
		&& src.includes(String.raw`.replace(/\\\^\{\}/g, "^")`),
	"Diff annotation PDF rewrite should decode pandoc's escaped code-text sequences before preserving math and inline code spans.",
);
assert.match(src, /function readVerbatimMathOperand\s*\(/, "Missing verbatim-safe diff math operand reader.");
assert.match(src, /function makeHighlightingMathScriptsVerbatimSafe\s*\(/, "Missing verbatim-safe diff math rewrite helper.");
assert.ok(src.includes("\\sb") && src.includes("\\sp"), "Verbatim-safe diff math should rewrite sub/superscripts via \\sb/\\sp.");
assert.match(src, /const cleaned = makeHighlightingMathScriptsVerbatimSafe\(renderAnnotationPdfLatex\(markerText\)\);/, "Diff token annotation rewrite should use the markdown-ish PDF annotation renderer plus verbatim-safe math rewrite.");
assert.match(src, /function replaceAnnotationMarkersInDiffTokenLine\s*\(/, "Missing diff-token annotation rewrite helper.");
assert.match(src, /function rewriteGeneratedDiffHighlighting\s*\(/, "Missing generated LaTeX diff rewrite helper.");
assert.match(src, /function renderMarkdownToPdfViaGeneratedLatex\s*\(/, "Missing generated-LaTeX PDF path for diff exports.");
assert.match(
	src,
	/hasMarkdownDiffFence\(markdownForPdf\)/,
	"PDF export should route diff-containing markdown through the generated-LaTeX rewrite path.",
);

assert.match(src, /const annotationHelpers = window\.PiMarkdownPreviewAnnotationHelpers \|\| null;/, "Browser preview should use the embedded annotation helper bundle.");
assert.match(src, /const applyPreviewAnnotationPlaceholders = \(root\) =>/, "Missing browser preview annotation placeholder application helper.");
assert.match(src, /typeof annotationHelpers\.renderPreviewAnnotationHtml === 'function'/, "Browser preview markers should render safe inline emphasis/code HTML from the helper.");
assert.match(src, /const decorateDiffCodeBlocks = \(root\) =>/, "Missing diff-preview decoration helper.");
assert.ok(src.includes("diff-add-line"), "Browser preview should classify added diff lines.");
assert.ok(src.includes("diff-del-line"), "Browser preview should classify deleted diff lines.");
assert.ok(src.includes("diff-header-line"), "Browser preview should classify diff header lines.");
assert.ok(src.includes("diff-meta-line"), "Browser preview should classify diff metadata lines.");
assert.ok(src.includes("diff-hunk-line"), "Browser preview should classify diff hunk lines.");
assert.ok(
	src.includes("if (/^\\\\+(?!\\\\+\\\\+)/.test(text)) {"),
	"Browser diff styling should avoid misclassifying +++ header lines as added lines.",
);
assert.ok(
	src.includes("} else if (/^-(?!--)/.test(text)) {"),
	"Browser diff styling should avoid misclassifying --- header lines as deleted lines.",
);
assert.match(src, /const renderAnnotationMarkerMath = async \(root\) =>/, "Missing annotation-marker math rendering helper.");
assert.match(src, /await mathJax\.typesetPromise\(markers\);/, "Browser annotation math rendering should typeset full marker elements so emphasis/code markup survives.");

assert.ok(
	src.includes("./node_modules/mathjax/es5/tex-chtml.js") && src.includes("MATHJAX_SCRIPT_URL"),
	"Browser/terminal preview should load MathJax from node_modules for preview equations.",
);
assert.match(
	src,
	/function applyBrowserThemeOverride\(style: PreviewStyle, requestedTheme: BrowserThemePreference = "light"\)/,
	"Browser previews should retain the fork's light default and explicit theme override.",
);
assert.match(
	src,
	/renderMarkdownToHtmlWithPandoc\(pandocMarkdown, resourcePath, isLatex, "mathjax", signal\)/,
	"Browser HTML artifacts should ask Pandoc for MathJax-compatible output.",
);
assert.ok(
	src.includes('./node_modules/mathjax/es5/tex-svg-full.js') &&
		src.includes('mathJaxAssetMode: MathJaxAssetMode = "local-chtml"') &&
		src.includes('outputPath, "inline-svg"'),
	"HTML artifact export should embed local MathJax SVG support while interactive previews retain the lightweight local URL.",
);
assert.match(
	src,
	/const renderMathFallback = async \(root\) =>/,
	"Expected targeted MathJax fallback for pandoc-unsupported preview equations.",
);
assert.match(
	src,
	/await renderMermaid\(\);\s*applyPreviewAnnotationPlaceholders\(root\);\s*decorateDiffCodeBlocks\(root\);\s*await renderAnnotationMarkerMath\(root\);\s*await renderMathFallback\(root\);/s,
	"Browser preview should apply preview placeholders, decorate diffs, render annotation math, then run general math fallback.",
);

assert.ok(
	src.includes('name: "preview_export"') &&
		src.includes('const PREVIEW_EXPORT_FORMATS = ["pdf", "html", "png"] as const;') &&
		src.includes("resolvePreviewInput(ctx, params, signal)"),
	"Upstream preview_export support should remain registered for PDF, HTML, and PNG inputs.",
);
assert.ok(
	src.includes("export async function openPreview(") &&
		src.includes("export async function openPreviewInBrowser(") &&
		src.includes("export async function closeSharedPreviewBrowser()"),
	"Upstream programmatic preview helpers should remain exported.",
);
assert.ok(
	src.includes("async function getSharedPreviewBrowser()") &&
		src.includes("await closeSharedPreviewBrowser();") &&
		src.includes("const browser = await getSharedPreviewBrowser();"),
	"Terminal, PNG, and browser-PDF rendering should share Chromium and close it at session shutdown.",
);
assert.ok(
	src.includes('Buffer.from(await browserPage.screenshot({ type: "png" }))') &&
		src.includes("const pageScreenshot = Buffer.from(await browserPage.screenshot({"),
	"Puppeteer Uint8Array screenshots must become Buffers before base64 encoding.",
);
assert.ok(
	src.includes('pi.registerCommand("preview-pdf-save"') &&
		src.includes("async function renderBrowserPdfToFile(") &&
		src.includes("await page.pdf({"),
	"The fork's Chromium PDF command should remain available on the upstream shared-browser pipeline.",
);
assert.ok(
	src.includes('join(CACHE_DIR, `_browser_pdf_${randomUUID()}.html`)') &&
		src.includes("await unlink(htmlPath).catch(() => {});"),
	"Concurrent Chromium PDF jobs should use isolated temporary HTML files and clean them up.",
);
assert.ok(
	src.includes("const milliseconds = String(date.getMilliseconds()).padStart(3, \"0\");") &&
		src.includes("const uniqueSuffix = randomUUID().slice(0, 8);"),
	"Default Chromium PDF destinations should be collision-resistant.",
);
assert.ok(
	src.includes('return { error: "Use either --out or --out-dir, not both." };') &&
		src.includes('return { error: "--theme is only supported for browser previews and /preview-pdf-save." };'),
	"Fork-only output and theme options should reject ambiguous or inapplicable combinations.",
);
assert.ok(
	src.includes("function normalizeArtifactOutputPath(") &&
		src.includes("must use the ${expectedExtension} extension") &&
		src.includes("normalizeArtifactOutputPath(resolveUserPath(ctx, params.outputPath), format)"),
	"Artifact output paths should append missing extensions and reject mismatches.",
);
assert.ok(
	src.includes("Unterminated ${quote === '\"' ? \"double\" : \"single\"} quote.") &&
		src.includes("const outputEquals = token.match(/^--(out|out-dir)=(.*)$/);") &&
		src.includes('if (token === "--")'),
	"Command arguments should detect malformed quotes and support equals forms plus the option terminator.",
);
assert.ok(
	src.includes('const defaultArtifactTheme: BrowserThemePreference = format === "html" ? "light" : "auto";') &&
		src.includes("params.theme ?? defaultArtifactTheme"),
	"HTML artifacts should default to the fork's light browser palette while PNG artifacts follow pi by default.",
);
assert.ok(
	src.includes("class PreviewExportCancelledError extends Error") &&
		src.includes("function attachAbortToChildProcess(") &&
		src.includes('process.kill(-child.pid, force ? "SIGKILL" : "SIGTERM")') &&
		src.includes("terminateWindowsProcessTreeWithPowerShell(") &&
		src.includes("if (isPreviewExportCancellation(error, signal)) return cancellationResult();"),
	"Artifact cancellation should terminate subprocess trees and return a cancellation result.",
);
assert.ok(
	src.includes('import crossSpawn from "cross-spawn";') &&
		src.includes("crossSpawn(mermaidCommand, args, {") &&
		src.includes("crossSpawn(pandocCommand, args, {"),
	"Rendering commands should use a shell-free launcher that supports Windows npm shims.",
);
assert.equal(
	(src.match(/error\.code === "EPIPE"/g) ?? []).length,
	4,
	"Every rendering subprocess stdin stream should handle EPIPE during cancellation.",
);
assert.ok(
	src.includes("const temporaryPath = join(dirname(pdfPath)") &&
		src.includes("const temporaryPath = join(dirname(htmlPath)") &&
		src.includes("const temporaryPaths = paths.map(") &&
		src.includes("await withArtifactPublicationLocks(destinationPaths, async () => {") &&
		src.includes("await publishStagedFiles(temporaryPaths, paths);"),
	"PDF, HTML, and PNG exports should stage output before replacing final artifacts.",
);

const annotationFixture = await readFile(new URL("./annotation-markdownish.md", import.meta.url), "utf8");
const scanner = await import(new URL("../shared/annotation-scanner.js", import.meta.url));
await import(new URL("../client/annotation-helpers.js", import.meta.url));
const browserHelpers = globalThis.PiMarkdownPreviewAnnotationHelpers;

assert.ok(browserHelpers, "PiMarkdownPreviewAnnotationHelpers did not load for regression checks.");

assert.deepEqual(
	scanner.collectInlineAnnotationMarkers("A [an: use [docs](https://example.com/docs)] and [an: prefer `npm test` here] plus `[an: literal]`.").map((marker) => marker.body),
	["use [docs](https://example.com/docs)", "prefer `npm test` here"],
	"Shared annotation scanner should keep markdown-ish annotation bodies intact while ignoring inline-code literals.",
);
assert.equal(
	scanner.hasMarkdownAnnotationMarkers("Literal `[an: note]` sample"),
	false,
	"Shared annotation scanner should ignore annotation-like inline-code literals.",
);
assert.equal(
	scanner.replaceInlineAnnotationMarkers("Before [an: first] and [an: second [docs](https://example.com/second)].", (marker) => `{ANNOT:${scanner.normalizeAnnotationText(marker.body)}}`),
	"Before {ANNOT:first} and {ANNOT:second [docs](https://example.com/second)}.",
	"Shared annotation replacement should preserve nested markdown-ish annotation bodies.",
);
const preparedShared = scanner.prepareMarkdownForPandocPreview(annotationFixture, "TESTANNOT");
assert.equal(preparedShared.placeholders.length, 7, "Shared pandoc-preview preparation should replace all prose annotations outside fences.");
assert.deepEqual(
	preparedShared.placeholders.map((entry) => entry.text),
	[
		"note",
		"see https://example.com/docs?a=1&b=2",
		"use [docs](https://example.com/docs)",
		"prefer `npm test` here",
		"keep *focus* and _tone_",
		"first",
		"second [docs](https://example.com/second)",
	],
	"Shared pandoc-preview preparation should preserve markdown-ish annotation label text.",
);
assert.match(
	preparedShared.markdown,
	/```md\n\[an: literal \[docs\]\(https:\/\/example\.com\/literal\)\] should stay literal inside fenced code\n```/,
	"Shared pandoc-preview preparation should leave fenced annotation-like literals untouched.",
);

assert.deepEqual(
	browserHelpers.collectInlineAnnotationMarkers("Multiple [an: first] markers [an: second [docs](https://example.com/second)] here.").map((marker) => marker.body),
	["first", "second [docs](https://example.com/second)"],
	"Browser annotation helper should parse multiple markdown-ish annotations on one line.",
);
assert.equal(
	browserHelpers.renderPreviewAnnotationHtml("keep *focus* and **tone** plus `npm test`"),
	"keep <em>focus</em> and <strong>tone</strong> plus <code>npm test</code>",
	"Browser annotation helper should render safe inline emphasis and code.",
);
assert.equal(
	browserHelpers.renderPreviewAnnotationHtml("use [docs](https://example.com/docs) and https://example.com/docs"),
	"use [docs](https://example.com/docs) and https://example.com/docs",
	"Browser annotation helper should not activate links inside annotation badges.",
);
const preparedBrowser = browserHelpers.prepareMarkdownForPandocPreview(annotationFixture, "TESTANNOT");
assert.equal(preparedBrowser.placeholders.length, 7, "Browser annotation helper should prepare preview placeholders for prose annotations.");
assert.ok(preparedBrowser.markdown.includes("TESTANNOT0TOKEN") && preparedBrowser.markdown.includes("TESTANNOT6TOKEN"), "Browser annotation helper should inject deterministic preview placeholder tokens.");
assert.equal(
	browserHelpers.prepareMarkdownForPandocPreview("- `[an: prefer \\`npm test\\` here]`\n- [an: keep *focus* and _tone_!]", "TESTANNOT").placeholders.length,
	1,
	"Browser annotation helper should ignore fully inline-code annotation examples without desynchronizing later parsing.",
);

console.log("Regression checks passed.");
