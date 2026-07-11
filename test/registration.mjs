import assert from "node:assert/strict";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(testDir, "..");
const outputDir = join(rootDir, ".test-dist");
const tscScript = join(rootDir, "node_modules", "typescript", "bin", "tsc");

async function compileExtension() {
	await rm(outputDir, { recursive: true, force: true });
	const result = spawnSync(
		process.execPath,
		[tscScript, "-p", join(rootDir, "tsconfig.json"), "--noEmit", "false", "--outDir", outputDir, "--declaration", "false"],
		{ cwd: rootDir, encoding: "utf-8" },
	);
	if (result.status !== 0) {
		throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n") || `TypeScript compilation failed with exit code ${result.status}.`);
	}

	await mkdir(join(outputDir, "client"), { recursive: true });
	await copyFile(join(rootDir, "client", "annotation-helpers.js"), join(outputDir, "client", "annotation-helpers.js"));
}

try {
	await compileExtension();
	const extension = await import(pathToFileURL(join(outputDir, "index.js")).href);

	assert.equal(typeof extension.default, "function", "Extension entry point should be callable.");
	assert.equal(typeof extension.openPreview, "function", "openPreview should remain a public helper.");
	assert.equal(typeof extension.openPreviewInBrowser, "function", "openPreviewInBrowser should remain a public helper.");
	assert.equal(typeof extension.closeSharedPreviewBrowser, "function", "closeSharedPreviewBrowser should remain a public helper.");

	const commands = new Map();
	const tools = [];
	const eventHandlers = new Map();
	const pi = {
		on(eventName, handler) {
			const handlers = eventHandlers.get(eventName) ?? [];
			handlers.push(handler);
			eventHandlers.set(eventName, handlers);
		},
		registerCommand(name, definition) {
			commands.set(name, definition);
		},
		registerTool(definition) {
			tools.push(definition);
		},
	};

	extension.default(pi);

	assert.deepEqual(
		[...commands.keys()].sort(),
		["preview", "preview-browser", "preview-clear-cache", "preview-pdf", "preview-pdf-save"],
		"All upstream and fork slash commands should be registered once.",
	);
	assert.equal(tools.length, 1, "Exactly one artifact export tool should be registered.");
	assert.equal(tools[0].name, "preview_export", "The upstream artifact tool should remain registered.");
	assert.deepEqual(tools[0].parameters.properties.format.enum, ["pdf", "html", "png"]);
	assert.deepEqual(tools[0].parameters.properties.theme.enum, ["light", "dark", "auto"]);
	assert.equal(eventHandlers.get("session_shutdown")?.length, 1, "Shared Chromium should have one shutdown handler.");

	const notifications = [];
	let waitForIdleCalls = 0;
	const commandContext = {
		cwd: rootDir,
		sessionManager: { getBranch: () => [] },
		ui: {
			theme: undefined,
			notify(message, level) {
				notifications.push({ message, level });
			},
		},
		async waitForIdle() {
			waitForIdleCalls++;
		},
	};

	await commands.get("preview").handler("--browser --theme=sepia", commandContext);
	assert.deepEqual(notifications.pop(), {
		message: 'Invalid theme "sepia". Use light, dark, or auto.',
		level: "error",
	});
	await commands.get("preview").handler('"unterminated', commandContext);
	assert.deepEqual(notifications.pop(), {
		message: "Unterminated double quote.",
		level: "error",
	});
	assert.equal(waitForIdleCalls, 0, "Invalid preview options should fail before waiting or rendering.");

	await commands.get("preview").handler("--theme dark", commandContext);
	assert.deepEqual(notifications.pop(), {
		message: "--theme is only supported for browser previews and /preview-pdf-save.",
		level: "error",
	});

	await commands.get("preview-pdf-save").handler("--out=one.pdf --out-dir=exports", commandContext);
	assert.deepEqual(notifications.pop(), {
		message: "Use either --out or --out-dir, not both.",
		level: "error",
	});

	await assert.rejects(
		() => tools[0].execute("invalid-extension", {
			format: "html",
			source: "markdown",
			markdown: "# Invalid extension",
			outputPath: join(rootDir, "preview.pdf"),
		}, undefined, undefined, commandContext),
		/Output path for HTML must use the \.html extension, received "\.pdf"\./,
	);

	await commands.get("preview-pdf-save").handler("--help", commandContext);
	assert.match(notifications.pop().message, /^Usage: \/preview-pdf-save /);
	assert.equal(waitForIdleCalls, 0, "Help and invalid options should not wait for the agent.");

	await commands.get("preview-pdf-save").handler("--out=preview.html --file=README.md", commandContext);
	assert.deepEqual(notifications.pop(), {
		message: 'PDF save failed: Output path for PDF must use the .pdf extension, received ".html".',
		level: "error",
	});

	await commands.get("preview").handler(String.raw`--file=C:\missing\preview.md`, commandContext);
	assert.match(notifications.pop().message, /C:\\missing\\preview\.md/);
	await commands.get("preview").handler("-- --dash-prefixed-preview.md", commandContext);
	assert.match(notifications.pop().message, /--dash-prefixed-preview\.md/);
	assert.equal(waitForIdleCalls, 3, "Valid path syntax should reach file resolution.");

	console.log("Extension registration checks passed.");
} finally {
	await rm(outputDir, { recursive: true, force: true });
}
