# pi-markdown-preview

> **Personal fork** of [omaclaren/pi-markdown-preview](https://github.com/omaclaren/pi-markdown-preview) v0.9.9. Not intended for public use.
>
> Changes: browser preview defaults to light, `--theme` parameter, browser-based PDF save command, MathJax rendering via local npm dependency.

Preview assistant responses and local Markdown, LaTeX, code, diff, and other text-based files from [pi](https://pi.dev) in the terminal, browser, or as PDF, with math rendering, syntax highlighting, Mermaid, and theme-aware styling.

## Screenshots

Preview adapts to your pi theme. Examples with a custom theme and the built-in defaults:

**Terminal preview (custom theme):**

![Custom theme terminal preview](screenshots/custom-terminal.png)

**Terminal preview (default dark):**

![Dark terminal preview](screenshots/dark-terminal.png)

**Terminal preview (default light):**

![Light terminal preview](screenshots/light-terminal.png)

**Browser preview (default dark and light):**

<p float="left">
  <img src="screenshots/dark-browser.png" width="49%" />
  <img src="screenshots/light-browser.png" width="49%" />
</p>

## Features

- **Terminal preview (default)** — renders markdown as PNG images displayed inline (Kitty, iTerm2, Ghostty, WezTerm). Long responses are automatically split across navigable pages.
- **Browser preview** — opens rendered HTML in your default browser as a single continuous scrollable document. Defaults to light theme; pass `--theme dark` for dark or `--theme auto` to follow pi terminal theme.
- **PDF export via LaTeX** — `/preview --pdf` and `/preview-pdf` export via pandoc + xelatex (upstream behavior, unchanged).
- **PDF save via browser** — `/preview-pdf-save` saves PDF via Chromium (no LaTeX), supporting `--theme`, `--out`, `--out-dir`.
- **Mermaid diagrams** — renders ` ```mermaid` code blocks as SVG diagrams in terminal/browser previews, and as high-quality vector diagrams in PDF export when Mermaid CLI is available.
- **LaTeX/math support** — renders `$inline$`, `$$display$$`, `\(...\)`, and `\[...\]` math through MathJax loaded from `node_modules/mathjax` for browser-based previews, or native LaTeX for `/preview-pdf`.
- **Syntax highlighting** — fenced code blocks in markdown and standalone code files are rendered with theme-aware syntax colouring via pandoc. Supports 50+ languages including TypeScript, Python, Rust, Go, C/C++, Julia, and more.
- **Annotation marker highlighting** — inline `[an: ...]` markers are highlighted in terminal/browser/PDF previews as note-only chips (`...`, without the `[an: ]` wrapper) outside code blocks; long notes wrap correctly in PDF instead of running off the page.
- **Theme-aware** — matches your pi theme (dark/light inference, export page/card colours, Markdown colours, accent colours, syntax colours).
- **Response picker** — select any past assistant response to preview, not just the latest.
- **File preview** — preview arbitrary Markdown files (including `.md`, `.mdx`, `.rmd`, `.qmd`), LaTeX `.tex` files, diff/patch files, or code files (`.py`, `.ts`, `.js`, `.rs`, etc.) from the filesystem. LaTeX files are rendered as documents with full math and sectioning; diff files are rendered with coloured add/remove lines; code files are rendered with syntax highlighting.
- **Caching** — rendered pages are cached for instant re-display; refresh (`r`) bypasses cache.

## Prerequisites

- [Pandoc](https://pandoc.org/installing.html) (`brew install pandoc` on macOS)
- For terminal preview (`/preview` default): a Chromium-based browser executable (Chrome, Brave, Edge, Chromium). `puppeteer-core` is included as an npm dependency; no separate Puppeteer install is needed.
- For terminal inline display: a terminal with image support (Ghostty, Kitty, iTerm2, WezTerm).
- For `/preview --pdf` export (optional): a LaTeX engine, e.g. [TeX Live](https://tug.org/texlive/) (`brew install --cask mactex` on macOS, `apt install texlive` on Linux).
- For Mermaid-in-PDF support (optional): Mermaid CLI (`npm install -g @mermaid-js/mermaid-cli`) and a Chromium browser accessible to Mermaid CLI.

## Install

```bash
pi install git:github.com/SleeperXZY/pi-markdown-preview
```

Pi will clone the repository and automatically run `npm install` to fetch runtime dependencies (`puppeteer-core`, `mathjax`). The installed path is:

```text
~/.pi/agent/git/github.com/SleeperXZY/pi-markdown-preview/
```

To update the fork to a newer commit:

```bash
pi update --extensions
```

## Usage

| Command | Description |
|---------|-------------|
| `/preview` | Preview the latest assistant response in terminal |
| `/preview --pick` | Select from all assistant responses |
| `/preview <path/to/file>` | Preview a Markdown, LaTeX, diff, or code file |
| `/preview --file <path/to/file>` | Preview a file (explicit flag) |
| `/preview --browser` | Open preview in default browser (defaults to light theme) |
| `/preview --browser --theme dark` | Open browser preview with dark theme |
| `/preview --font-size 14` | Preview with a custom terminal/browser font size in px (defaults: terminal 16, browser 15) |
| `/preview-browser` | Shortcut for browser preview |
| `/preview-browser <path/to/file>` | Open a file preview in browser |
| `/preview --pdf` | Export to PDF via LaTeX and open |
| `/preview-pdf` | Shortcut for `--pdf` |
| `/preview --pdf <path/to/file>` | Export a file to PDF via LaTeX |
| `/preview-pdf-save` | Save preview as PDF via browser/Chromium (no LaTeX) |
| `/preview-pdf-save --theme dark file.md` | Save PDF with dark theme |
| `/preview-clear-cache` | Clear rendered preview cache |
| `/preview --pick --browser` | Pick a response, open in browser |

Local images are supported. File previews resolve relative image paths against the previewed file's directory; assistant-response previews resolve them against pi's current working directory. Absolute paths, `file:`, `http(s):`, and `data:` image URLs also work.

Additional accepted argument aliases:
- Pick: `-p`, `pick`
- File: `-f`
- Browser target: `browser`, `--external`, `external`, `--browser-native`, `native`
- PDF target: `pdf`
- Terminal target: `terminal`, `--terminal` (usually unnecessary because terminal is the default)
- Font size: `--font-size <px>`, `--font-size=<px>`, `--font-size-px <px>`, `--fs <px>` (10–24 px; terminal/browser previews; defaults: terminal 16, browser 15)
- Theme: `--theme light|dark|auto` (browser preview and `/preview-pdf-save` only; defaults to light; `auto` uses terminal theme inference)
- Output path: `--out <path>` (`/preview-pdf-save` only)
- Output directory: `--out-dir <dir>` (`/preview-pdf-save` only; default: `./.pi-markdown-preview`)
- Help: `--help`, `-h`, `help`
- Note: `--pick` and `--file` cannot be used together

PDF export via LaTeX uses Pandoc plus a LaTeX PDF engine (`xelatex` by default). The PDF preamble uses optional styling packages when they are available (including light code-block backgrounds via `framed`) and falls back to simpler output otherwise. Long-running PDF subprocesses time out after 120 seconds by default; set `PI_MARKDOWN_PREVIEW_PDF_TIMEOUT_MS` to adjust this.

To validate command docs against implementation:

```bash
npm run check:readme-commands
```

### Keyboard shortcuts (terminal preview)

| Key | Action |
|-----|--------|
| `←` / `→` | Navigate pages |
| `r` | Refresh (re-render with current theme) |
| `o` | Open current preview in browser |
| `Esc` | Close preview |

## Differences from upstream

### Browser theme defaults to light
- `/preview --browser` and `/preview-browser` default to the light preview palette regardless of terminal theme.

### `--theme` parameter
- `--theme light|dark|auto` for browser-targeted rendering and `/preview-pdf-save`.
- `light` / `dark` force the corresponding palette; `auto` follows pi terminal theme.
- Terminal preview is unaffected (always uses terminal theme).

### New command: `/preview-pdf-save`
- Generates PDF via browser/Chromium (`page.pdf()`) instead of LaTeX.
- Default theme: `light`.
- Default output: `./.pi-markdown-preview/YYYYMMDD-HHMMSS-<basename|preview>.pdf`.
- Supports `--out <path>` and `--out-dir <dir>`.
- Does **not** auto-open.

### Browser math rendering
- Pandoc emits MathJax-compatible HTML (`--mathjax`) instead of MathML for browser-based previews.
- MathJax is loaded from `node_modules/mathjax/es5/tex-chtml.js` (declared as npm dependency).
- Terminal preview and `/preview --pdf` are unaffected.

### Unchanged upstream behavior
- Terminal preview (`/preview` default) — theme, font-size, caching, paging.
- `/preview --pdf` and `/preview-pdf` — LaTeX-based PDF export and auto-open.
- `/preview-clear-cache` — cache clearing.
- All existing keyboard shortcuts and argument aliases.

## Configuration

Set `PANDOC_PATH` if pandoc is not on your `PATH`:

```bash
export PANDOC_PATH=/usr/local/bin/pandoc
```

Set `PANDOC_PDF_ENGINE` to override the LaTeX engine used for PDF export (default: `xelatex`):

```bash
export PANDOC_PDF_ENGINE=xelatex
```

Set `PUPPETEER_EXECUTABLE_PATH` to override Chromium detection for terminal preview rendering:

```bash
export PUPPETEER_EXECUTABLE_PATH=/path/to/chromium
```

Terminal preview uses the known-good fixed screenshot path: 1200px Chromium viewport at device scale `2`. Set `PI_MARKDOWN_PREVIEW_DEVICE_SCALE_FACTOR` only if you want to experiment with screenshot density manually (default: `2`; range: `1`–`2.5`):

```bash
export PI_MARKDOWN_PREVIEW_DEVICE_SCALE_FACTOR=2
```

Set `MERMAID_CLI_PATH` if `mmdc` is not on your `PATH`:

```bash
export MERMAID_CLI_PATH=/path/to/mmdc
```

Set `MERMAID_PDF_THEME` for PDF Mermaid rendering (`default`, `forest`, `dark`, `neutral`; default: `default`):

```bash
export MERMAID_PDF_THEME=default
```

## Cache

Rendered previews are cached at `~/.pi/cache/markdown-preview/`. Clear with:

```bash
/preview-clear-cache
```

Or manually:

```bash
rm -rf ~/.pi/cache/markdown-preview/
```

## License

MIT — see [LICENSE](LICENSE).
