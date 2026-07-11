import assert from "node:assert/strict";
import { chmod, copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(testDir, "..");
const compiledDir = join(rootDir, ".test-dist-cancellation");
const temporaryDir = await mkdtemp(join(tmpdir(), "pi-markdown-preview-cancel-"));
const fakePandocModulePath = join(temporaryDir, "fake-pandoc.mjs");
const fakePandocPath = process.platform === "win32" ? join(temporaryDir, "fake-pandoc.cmd") : fakePandocModulePath;
const tscScript = join(rootDir, "node_modules", "typescript", "bin", "tsc");

async function compileExtension() {
	await rm(compiledDir, { recursive: true, force: true });
	const result = spawnSync(
		process.execPath,
		[tscScript, "-p", join(rootDir, "tsconfig.json"), "--noEmit", "false", "--outDir", compiledDir, "--declaration", "false"],
		{ cwd: rootDir, encoding: "utf-8" },
	);
	if (result.status !== 0) {
		throw new Error([result.stdout, result.stderr].filter(Boolean).join("\n") || `TypeScript compilation failed with exit code ${result.status}.`);
	}
	await mkdir(join(compiledDir, "client"), { recursive: true });
	await copyFile(join(rootDir, "client", "annotation-helpers.js"), join(compiledDir, "client", "annotation-helpers.js"));
}

async function waitForFile(filePath, timeoutMs = 3000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			return await readFile(filePath, "utf-8");
		} catch {
			await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
		}
	}
	throw new Error(`Timed out waiting for ${filePath}.`);
}

function isProcessAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return error?.code === "EPERM";
	}
}

async function waitForProcessesToExit(pids, timeoutMs = 3000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (pids.every((pid) => !isProcessAlive(pid))) return;
		await new Promise((resolveDelay) => setTimeout(resolveDelay, 25));
	}
	assert.fail(`Cancelled process tree still running: ${pids.filter(isProcessAlive).join(", ")}`);
}

async function withTimeout(promise, label, timeoutMs = 4000) {
	let timeout;
	try {
		return await Promise.race([
			promise,
			new Promise((_, reject) => {
				timeout = setTimeout(() => reject(new Error(`${label} timed out.`)), timeoutMs);
			}),
		]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}

const fakePandocSource = `#!/usr/bin/env node
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const descendant = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
writeFileSync(process.env.PI_PREVIEW_CANCEL_READY, JSON.stringify({ parent: process.pid, descendant: descendant.pid }));
process.on("SIGTERM", () => setTimeout(() => process.exit(0), 100));
process.stdin.resume();
setInterval(() => {}, 1000);
`;

let extension;
const spawnedProcessIds = new Set();
try {
	await writeFile(fakePandocModulePath, fakePandocSource, "utf-8");
	if (process.platform === "win32") {
		await writeFile(fakePandocPath, `@echo off\r\n"${process.execPath}" "%~dp0fake-pandoc.mjs" %*\r\n`, "utf-8");
	} else {
		await chmod(fakePandocPath, 0o755);
	}
	await compileExtension();
	extension = await import(pathToFileURL(join(compiledDir, "index.js")).href);

	let previewExport;
	extension.default({
		on() {},
		registerCommand() {},
		registerTool(definition) {
			if (definition.name === "preview_export") previewExport = definition;
		},
	});
	assert.ok(previewExport, "preview_export should be registered.");

	const ctx = {
		cwd: temporaryDir,
		sessionManager: { getBranch: () => [] },
		ui: { theme: undefined },
	};
	const previousPandocPath = process.env.PANDOC_PATH;
	const previousMermaidPath = process.env.MERMAID_CLI_PATH;
	process.env.PANDOC_PATH = fakePandocPath;

	try {
		const cases = [
			{ label: "html", format: "html", markdown: "# HTML cancellation" },
			{ label: "pdf", format: "pdf", markdown: "# PDF cancellation" },
			{ label: "png", format: "png", markdown: "# PNG cancellation" },
			{ label: "mermaid-pdf", format: "pdf", markdown: "```mermaid\ngraph TD\n  A --> B\n```", mermaid: true },
		];
		for (const testCase of cases) {
			const readyPath = join(temporaryDir, `${testCase.label}-ready.json`);
			const outputPath = join(temporaryDir, `existing-${testCase.label}.${testCase.format}`);
			const originalContent = `preserve-${testCase.label}`;
			await writeFile(outputPath, originalContent, "utf-8");
			process.env.PI_PREVIEW_CANCEL_READY = readyPath;
			if (testCase.mermaid) process.env.MERMAID_CLI_PATH = fakePandocPath;
			else if (previousMermaidPath === undefined) delete process.env.MERMAID_CLI_PATH;
			else process.env.MERMAID_CLI_PATH = previousMermaidPath;

			const controller = new AbortController();
			const execution = previewExport.execute(`cancel-${testCase.label}`, {
				format: testCase.format,
				source: "markdown",
				markdown: `${testCase.markdown}\n\n${Date.now()}`,
				outputPath,
			}, controller.signal, undefined, ctx);
			const processIds = JSON.parse(await waitForFile(readyPath));
			spawnedProcessIds.add(processIds.parent);
			spawnedProcessIds.add(processIds.descendant);
			controller.abort();

			const result = await withTimeout(execution, `${testCase.label} cancellation`);
			assert.equal(result.content[0]?.text, "Preview export cancelled.");
			assert.equal(result.details, undefined);
			assert.equal(await readFile(outputPath, "utf-8"), originalContent, `${testCase.label} cancellation should preserve the destination.`);
			await waitForProcessesToExit([processIds.parent, processIds.descendant]);
		}

		const remainingFiles = await readdir(temporaryDir);
		assert.equal(remainingFiles.some((fileName) => fileName.includes(".tmp.")), false, "Cancellation should remove temporary artifacts.");
	} finally {
		if (previousPandocPath === undefined) delete process.env.PANDOC_PATH;
		else process.env.PANDOC_PATH = previousPandocPath;
		if (previousMermaidPath === undefined) delete process.env.MERMAID_CLI_PATH;
		else process.env.MERMAID_CLI_PATH = previousMermaidPath;
		delete process.env.PI_PREVIEW_CANCEL_READY;
	}

	console.log("Preview export cancellation checks passed for HTML, PDF, PNG, and Mermaid preprocessing.");
} finally {
	for (const pid of spawnedProcessIds) {
		if (!isProcessAlive(pid)) continue;
		try { process.kill(pid, "SIGKILL"); } catch {}
	}
	await extension?.closeSharedPreviewBrowser?.().catch(() => {});
	await rm(compiledDir, { recursive: true, force: true });
	await rm(temporaryDir, { recursive: true, force: true });
}
