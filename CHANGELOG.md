# Changelog

## 0.1.10 - 2026-09-19

### Changed

- `💾 Save`, `轉存html` and `◀ 收闔原始碼` moved out of the top bar into the right panel header, next to `👁 Preview` — the buttons now sit where editing actually happens. The top bar keeps only the title and the status message. `Ctrl+S` is unchanged, and the buttons stay reachable while the source panel is collapsed.
- Table and block controls are merged into a single toolbar row (`#toolsBar`) instead of two stacked rows. The element IDs the Webview bundle depends on are unchanged; `#tableBar` / `#blockBar` are replaced by `#toolsBar`.

### Added

- Collapse toggles for both toolbars: `▾` at the head of the table/block row, and `▾ 文字` to the left of the Quill font controls. The text toggle lives in `#fmtRow` beside — deliberately not inside — `.ql-toolbar`, so hiding the toolbar cannot hide the button that brings it back. Collapsing is CSS-only; the Quill instance is never rebuilt, so content, caret and undo history survive.
- Collapse state persists across sessions. The Webview sends a new `uiState` message (`{ sourceCollapsed, toolsCollapsed, fmtCollapsed }`); the host stores it in `globalState` under `htmlVisualEditor.uiState` and returns it in the `init` payload. Webview `setState` was not used — it is lost when the file is closed. The preference is global, shared by every document.

## 0.1.9 - 2026-07-31

### Fixed

- Header rows collapsed into a single cell when a document containing `<thead>` / `<th>` was opened in the visual editor. Quill's table module registers only `TD` / `TR` / `TBODY` / `TABLE` blots — it has no `TH` or `THEAD` — so header cells were not recognised and the whole row was flattened into one block. Verified with real Quill: cells per row went `[1, 3, 3]` for a three-column table.
- HTML sent to the Webview is now demoted (`thead > th` → `tbody > td`, `scope` dropped) via the new `demoteTableHeaders()`; save/export promotes it back. Round-trip is stable and repeatable.
- This also fixes a pre-existing issue for Markdown documents: GFM tables rendered by `markdownToHtml()` always carried `thead`, so their headers were mangled by the editor even before header promotion existed.

## 0.1.8 - 2026-07-31

### Fixed

- Table header promotion had no effect in practice. The Webview sends `sourceArea.value`, which is almost always a complete HTML document (`.html` files are documents themselves; `.md` files are rendered by `markdownToHtml()`), and `buildHtmlDocument()` returned those untouched. Both branches now promote table headers; the full-document branch rewrites tables only — no re-wrapping, no extra style injection, and the doctype, `<head>`, existing `<title>` and `<style>` are preserved.
- `promoteTableHeaders()` now parses complete documents with parse5's `parse()` instead of `parseFragment()`, which would have dropped the doctype and the `html` / `head` / `body` tags on serialization.

## 0.1.7 - 2026-07-30

### Fixed

- Extension failed to load from the packaged `.vsix` (clicking an `.html` / `.md` file did nothing). `esbuild.config.js` listed `parse5` as an external, but `vsce package --no-dependencies` ships no `node_modules`, so `require("parse5")` threw `MODULE_NOT_FOUND` at activation. Only `vscode` and Node built-ins are external now; npm packages are bundled.

> 0.1.6 is broken when installed from `.vsix` — use 0.1.7.

## 0.1.6 - 2026-07-30

### Fixed

- Exported tables now carry semantic headers: the first row's `<td>` cells are promoted to `<thead><th scope="col">` so the theme's header styling (blue gradient, bold navy text) applies. Previously Quill's table module emitted `<tbody><tr><td>` only, making header rows look identical to data rows.
- `htmlToMarkdown` no longer destroys tables. GFM table rules (`turndown-plugin-gfm`) are enabled, so HTML → Markdown auto-sync produces proper `| --- |` tables instead of scattered text.
- `htmlToMarkdown` no longer leaks the embedded theme CSS and `<title>` text into the generated `.md` (`save` passes the full themed document; `style` / `script` / `title` / `meta` / `link` are now removed).

### Notes

- Applied at the export / conversion layer only (`buildHtmlDocument()`, `htmlToMarkdown()`); the editor's internal table markup is unchanged. Idempotent — tables that already have `thead` or `th` are left untouched, and content that is already a full HTML document still passes through unmodified.

### Verified

- `npm run build`
- `npx jest` (6 suites / 60 tests)
- Browser render of a real export in light and dark mode

## 0.1.5 - 2026-07-16

### Added

- Document theme system: saved/exported HTML embeds the spec-blue theme (dark mode + print styles) automatically.
- External theme override: upward lookup of `.kiro/assets/doc-style.css` fully replaces the built-in theme (shared convention with `srs_sdd_bridge.py` / `md2html_specs.py`).
- Bundled theme template `media/doc-style.template.css` with EZLife logo (`--doc-logo` CSS variable) and usage notes, including logo replacement instructions.
- New command `HTML Visual Editor: 建立文件主題範本 (doc-style.css)` to scaffold the template into the workspace (confirm-before-overwrite).

### Changed

- `markdownToHtml` now uses the unified theme source instead of its embedded purple stylesheet.

### Verified

- `npm run build`
- `npx jest`

## 0.1.4 - 2026-07-07

### Added

- Register `.md` files with HTML Visual Editor.
- Set default editor associations for `.html` and `.md`.
- Show a `轉存html` toolbar button when editing Markdown files.
- Export Markdown-origin documents to same-name `.html` files from the editor.

### Changed

- Markdown mode now treats `Ctrl+S` as HTML export, preventing generated HTML from being written back into the original `.md` file.
- HTML-to-Markdown sync now emits stable italic and list formatting.

### Verified

- `npm.cmd run build`
- `npm.cmd test -- --runInBand`
