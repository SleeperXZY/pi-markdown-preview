import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(testDir, "..");
const compiledDir = join(rootDir, ".test-dist-smoke");
const artifactsDir = await mkdtemp(join(tmpdir(), "pi-markdown-preview-smoke-"));
const tscExecutable = join(rootDir, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");

function requireCommand(command, args = ["--version"]) {
	const result = spawnSync(command, args, { encoding: "utf-8" });
	if (result.error || result.status !== 0) {
		throw new Error(`Render smoke checks require ${command} on PATH.`);
	}
}

function findBrowserExecutable() {
	const configured = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || process.env.BROWSER;
	const candidates = configured ? [configured] : process.platform === "darwin"
		? [
			"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
			"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
		]
		: process.platform === "win32"
			? [
				"C:/Program Files/Google/Chrome/Application/chrome.exe",
				"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
				"C:/Program Files/Microsoft/Edge/Application/msedge.exe",
			]
			: [
				"/usr/bin/google-chrome",
				"/usr/bin/google-chrome-stable",
				"/usr/bin/chromium",
				"/usr/bin/chromium-browser",
			];

	for (const candidate of candidates) {
		const result = spawnSync(candidate, ["--version"], { encoding: "utf-8" });
		if (!result.error && result.status === 0) return candidate;
	}
	throw new Error("Render smoke checks require a Chromium-based browser.");
}

async function compileExtension() {
	await rm(compiledDir, { recursive: true, force: true });
	const result = spawnSync(
		tscExecutable,
		["-p", join(rootDir, "tsconfig.json"), "--noEmit", "false", "--outDir", compiledDir, "--declaration", "false"],
		{ cwd: rootDir, encoding: "utf-8" },
	);
	if (result.status !== 0) {
		throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n") || `TypeScript compilation failed with exit code ${result.status}.`);
	}

	await mkdir(join(compiledDir, "client"), { recursive: true });
	await copyFile(join(rootDir, "client", "annotation-helpers.js"), join(compiledDir, "client", "annotation-helpers.js"));
	await symlink(join(rootDir, "node_modules"), join(compiledDir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
}

requireCommand("pandoc");
requireCommand(process.env.PANDOC_PDF_ENGINE?.trim() || "xelatex");
const browserExecutable = findBrowserExecutable();
process.env.PUPPETEER_EXECUTABLE_PATH = browserExecutable;

let extension;
let directBrowser;
const shutdownHandlers = [];
const notifications = [];

try {
	await compileExtension();
	extension = await import(pathToFileURL(join(compiledDir, "index.js")).href);

	const commands = new Map();
	const tools = new Map();
	extension.default({
		on(eventName, handler) {
			if (eventName === "session_shutdown") shutdownHandlers.push(handler);
		},
		registerCommand(name, definition) {
			commands.set(name, definition);
		},
		registerTool(definition) {
			tools.set(definition.name, definition);
		},
	});

	const ctx = {
		cwd: artifactsDir,
		sessionManager: { getBranch: () => [] },
		ui: {
			theme: undefined,
			notify(message, level) {
				notifications.push({ message, level });
			},
		},
		async waitForIdle() {},
	};
	const tool = tools.get("preview_export");
	assert.ok(tool, "preview_export should be registered.");

	const markdown = `# Render smoke\n\nInline math: $x^2 + y^2 = z^2$.\n\n中文测试。\n\nCache-buster: ${Date.now()}\n\n\`\`\`ts\nconst answer: number = 42;\n\`\`\`\n`;
	const htmlPath = join(artifactsDir, "artifact.html");
	const htmlResult = await tool.execute("html-smoke", {
		format: "html",
		source: "markdown",
		markdown,
		outputPath: htmlPath,
	}, undefined, undefined, ctx);
	assert.deepEqual(htmlResult.details.paths, [htmlPath]);
	const html = await readFile(htmlPath, "utf-8");
	assert.match(html, /--bg: #f5f7fb;/, "HTML artifacts should default to the light palette.");
	assert.match(html, /const MATHJAX_SCRIPT_URL = null;/);
	assert.match(html, /const MATHJAX_SCRIPT_SOURCE = "/);
	assert.doesNotMatch(html, /cdn\.jsdelivr\.net\/npm\/mathjax/);

	const movedDir = join(artifactsDir, "moved");
	const movedHtmlPath = join(movedDir, "artifact.html");
	await mkdir(movedDir, { recursive: true });
	await copyFile(htmlPath, movedHtmlPath);
	directBrowser = await puppeteer.launch({ headless: true, executablePath: browserExecutable });
	const offlinePage = await directBrowser.newPage();
	await offlinePage.setOfflineMode(true);
	await offlinePage.goto(pathToFileURL(movedHtmlPath).href, { waitUntil: "domcontentloaded" });
	await offlinePage.waitForFunction("window.__mermaidDone === true", { timeout: 15000 });
	const offlineRender = await offlinePage.evaluate(() => ({
		hasMathSvg: Boolean(document.querySelector("mjx-container svg")),
		hasMathJax: typeof window.MathJax?.typesetPromise === "function",
		text: document.body.innerText,
	}));
	assert.equal(offlineRender.hasMathSvg, true, "Moved HTML should render math while offline.");
	assert.equal(offlineRender.hasMathJax, true);
	assert.match(offlineRender.text, /中文测试/);
	await offlinePage.close();
	await directBrowser.close();
	directBrowser = undefined;

	const pngPath = join(artifactsDir, "artifact.png");
	const pngResult = await tool.execute("png-smoke", {
		format: "png",
		source: "markdown",
		markdown,
		outputPath: pngPath,
		theme: "dark",
	}, undefined, undefined, ctx);
	assert.ok(pngResult.details.paths.length >= 1);
	for (const path of pngResult.details.paths) {
		const png = await readFile(path);
		assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
	}

	const latexPdfPath = join(artifactsDir, "artifact-latex.pdf");
	const pdfResult = await tool.execute("pdf-smoke", {
		format: "pdf",
		source: "markdown",
		markdown,
		outputPath: latexPdfPath,
	}, undefined, undefined, ctx);
	assert.deepEqual(pdfResult.details.paths, [latexPdfPath]);
	assert.equal((await readFile(latexPdfPath)).subarray(0, 5).toString(), "%PDF-");
	const extractedPdf = spawnSync("pdftotext", [latexPdfPath, "-"], { encoding: "utf-8" });
	if (!extractedPdf.error && extractedPdf.status === 0) {
		assert.match(extractedPdf.stdout, /中文测试/);
	}

	const sourcePath = join(artifactsDir, "source.md");
	await writeFile(sourcePath, markdown, "utf-8");
	await Promise.all([
		commands.get("preview-pdf-save").handler(`--theme dark "${sourcePath}"`, ctx),
		commands.get("preview-pdf-save").handler(`--theme dark "${sourcePath}"`, ctx),
	]);
	const browserPdfPaths = notifications
		.filter(({ message, level }) => level === "info" && message.startsWith("Saved PDF: "))
		.map(({ message }) => message.slice("Saved PDF: ".length));
	assert.equal(browserPdfPaths.length, 2);
	assert.equal(new Set(browserPdfPaths).size, 2, "Concurrent default PDF saves should use distinct destinations.");
	for (const browserPdfPath of browserPdfPaths) {
		assert.match(browserPdfPath, /\/\.pi-markdown-preview\/\d{8}-\d{6}-\d{3}-source-[0-9a-f]{8}\.pdf$/);
		assert.equal((await readFile(browserPdfPath)).subarray(0, 5).toString(), "%PDF-");
	}

	console.log("Render smoke checks passed: portable HTML, PNG, LaTeX PDF, and concurrent Chromium PDFs.");
} finally {
	await directBrowser?.close().catch(() => {});
	for (const handler of shutdownHandlers) await handler({}, { cwd: artifactsDir }).catch(() => {});
	await extension?.closeSharedPreviewBrowser?.().catch(() => {});
	await rm(compiledDir, { recursive: true, force: true });
	await rm(artifactsDir, { recursive: true, force: true });
}
