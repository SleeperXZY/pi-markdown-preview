# pi-markdown-preview

Rendered markdown and LaTeX preview for [pi](https://github.com/badlogic/pi-mono). Preview assistant responses or arbitrary markdown files directly in your terminal, browser, or as PDF, with full math rendering, syntax highlighting, and theme-aware styling.

## Screenshots

Preview adapts to your pi theme. Examples in dark and light:

**Terminal preview (dark):**

![Dark terminal preview](screenshots/dark-terminal.png)

**Terminal preview (light):**

![Light terminal preview](screenshots/light-terminal.png)

**Browser preview:**

<p float="left">
  <img src="screenshots/dark-browser.png" width="49%" />
  <img src="screenshots/light-browser.png" width="49%" />
</p>

## Features

- **Terminal preview** — renders markdown as PNG images displayed inline (Kitty, iTerm2, Ghostty, WezTerm). Long responses are automatically split across navigable pages.
- **Browser preview** — opens rendered HTML in your default browser as a single continuous scrollable document
- **PDF export** — exports markdown to PDF via pandoc + LaTeX and opens it in your default PDF viewer
- **LaTeX/math support** — renders `$inline$` and `$$display$$` math via MathML (browser/terminal) or native LaTeX (PDF)
- **Theme-aware** — matches your pi theme (dark/light, accent colours)
- **Response picker** — select any past assistant response to preview, not just the latest
- **File preview** — preview arbitrary `.md` files from the filesystem
- **Caching** — rendered pages are cached for instant re-display; refresh (`r`) bypasses cache

## Prerequisites

- A Chromium-based browser (Chrome, Brave, Edge, Chromium)
- [Pandoc](https://pandoc.org/installing.html) (`brew install pandoc` on macOS)
- A terminal with image support (Ghostty, Kitty, iTerm2, WezTerm) for inline preview
- A LaTeX engine for PDF export (optional): [TeX Live](https://tug.org/texlive/) (`brew install --cask mactex` on macOS, `apt install texlive` on Linux)

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
| `/preview README.md` | Preview a markdown file |
| `/preview --file ./docs/guide.md` | Preview a file (explicit flag) |
| `/preview --browser` | Open preview in default browser |
| `/preview --pdf` | Export to PDF and open |
| `/preview-pdf` | Shortcut for `--pdf` |
| `/preview --pdf README.md` | Export a file to PDF |
| `/preview --pick --browser` | Pick a response, open in browser |

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

Set `PUPPETEER_EXECUTABLE_PATH` to override browser detection:

```bash
export PUPPETEER_EXECUTABLE_PATH=/path/to/chromium
```

## Cache

Rendered previews are cached at `~/.pi/cache/markdown-preview/`. Clear with:

```bash
rm -rf ~/.pi/cache/markdown-preview/
```

## License

MIT
