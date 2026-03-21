# pi-markdown-preview

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
- **Browser preview** — opens rendered HTML in your default browser as a single continuous scrollable document
- **PDF export** — exports markdown to PDF via pandoc + LaTeX and opens it in your default PDF viewer
- **Mermaid diagrams** — renders ` ```mermaid` code blocks as SVG diagrams in terminal/browser previews, and as high-quality vector diagrams in PDF export when Mermaid CLI is available
- **LaTeX/math support** — renders `$inline$`, `$$display$$`, `\(...\)`, and `\[...\]` math via MathML with selective MathJax fallback for pandoc-unsupported browser/terminal equations, or native LaTeX (PDF)
- **Syntax highlighting** — fenced code blocks in markdown and standalone code files are rendered with theme-aware syntax colouring via pandoc. Supports 50+ languages including TypeScript, Python, Rust, Go, C/C++, Julia, and more.
- **Annotation marker highlighting** — inline `[an: ...]` markers are highlighted in terminal/browser/PDF previews as note-only chips (`...`, without the `[an: ]` wrapper) outside code blocks; long notes wrap correctly in PDF instead of running off the page
- **Theme-aware** — matches your pi theme (dark/light, accent colours, syntax colours)
- **Response picker** — select any past assistant response to preview, not just the latest
- **File preview** — preview arbitrary Markdown files (including `.md`, `.mdx`, `.rmd`, `.qmd`), LaTeX `.tex` files, diff/patch files, or code files (`.py`, `.ts`, `.js`, `.rs`, etc.) from the filesystem. LaTeX files are rendered as documents with full math and sectioning; diff files are rendered with coloured add/remove lines; code files are rendered with syntax highlighting.
- **Caching** — rendered pages are cached for instant re-display; refresh (`r`) bypasses cache

## Prerequisites

- [Pandoc](https://pandoc.org/installing.html) (`brew install pandoc` on macOS)
- For terminal preview (`/preview` default): a Chromium-based browser executable (Chrome, Brave, Edge, Chromium). `puppeteer-core` is included as an extension dependency; no separate Puppeteer install is needed.
- For terminal inline display: a terminal with image support (Ghostty, Kitty, iTerm2, WezTerm)
- For PDF export (optional): a LaTeX engine, e.g. [TeX Live](https://tug.org/texlive/) (`brew install --cask mactex` on macOS, `apt install texlive` on Linux)
- For Mermaid-in-PDF support (optional): Mermaid CLI (`npm install -g @mermaid-js/mermaid-cli`) and a Chromium browser accessible to Mermaid CLI

## Install

```bash
pi install npm:pi-markdown-preview
```

Or from GitHub:

```bash
pi install https://github.com/omaclaren/pi-markdown-preview
```

Or try it without installing:

```bash
pi -e https://github.com/omaclaren/pi-markdown-preview
```

## Usage

| Command | Description |
|---------|-------------|
| `/preview` | Preview the latest assistant response in terminal |
| `/preview --pick` | Select from all assistant responses |
| `/preview <path/to/file>` | Preview a Markdown, LaTeX, diff, or code file |
| `/preview --file <path/to/file>` | Preview a file (explicit flag) |
| `/preview --browser` | Open preview in default browser |
| `/preview-browser` | Shortcut for browser preview |
| `/preview-browser <path/to/file>` | Open a file preview in browser |
| `/preview --pdf` | Export to PDF and open |
| `/preview-pdf` | Shortcut for `--pdf` |
| `/preview --pdf <path/to/file>` | Export a file to PDF |
| `/preview-clear-cache` | Clear rendered preview cache |
| `/preview --pick --browser` | Pick a response, open in browser |

Additional accepted argument aliases:
- Pick: `-p`, `pick`
- File: `-f`
- Browser target: `browser`, `--external`, `external`, `--browser-native`, `native`
- PDF target: `pdf`
- Terminal target: `terminal`, `--terminal` (usually unnecessary because terminal is the default)
- Help: `--help`, `-h`, `help`
- Note: `--pick` and `--file` cannot be used together

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

MIT
