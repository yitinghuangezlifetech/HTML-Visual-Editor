# HTML Visual Editor

VS Code / Kiro extension for visually editing HTML content with a rich text editor, source view, live preview, and Markdown export workflow.

## Version 0.1.5

This release adds the document theme system with a bundled template and brand logo.

- Saved / exported HTML now embeds a document theme automatically (spec-blue, dark mode, print styles).
- Theme lookup: the extension searches upward from the document for `.kiro/assets/doc-style.css`; if found, that file fully replaces the built-in theme, otherwise the built-in (brand-free) fallback is used.
- New command: `HTML Visual Editor: 建立文件主題範本 (doc-style.css)` — writes the bundled template (with EZLife logo and usage notes) into the current workspace's `.kiro/assets/`.
- The bundled template ships at `media/doc-style.template.css` inside the extension.

## 文件主題樣式（Document Theme）

存檔／轉存產生的 HTML 會自動內嵌主題樣式：

1. 外掛自「文件所在目錄」向上查找 `.kiro/assets/doc-style.css`，找到即**完整取代**內建預設；找不到則用內建 fallback（無品牌）。
2. 快速啟用：指令面板執行 `HTML Visual Editor: 建立文件主題範本 (doc-style.css)`，範本（含 EZLife logo 與說明註解）會寫入工作區 `.kiro/assets/doc-style.css`；檔案已存在會先詢問才覆寫。
3. 此約定與 `.kiro/scripts/srs_sdd_bridge.py`、`md2html_specs.py` 共用——多工具輸出外觀一致。

### Logo 置換路徑

logo 收錄於 `.kiro/assets/doc-style.css` 檔頭的 CSS 變數 `--doc-logo`（data URI），置換步驟：

1. 準備圖檔（建議高約 72px，PNG／WebP／SVG 皆可）。
2. 產生 data URI（擇一）：
   - python: `python -c "import base64;print('data:image/png;base64,'+base64.b64encode(open('logo.png','rb').read()).decode())"`
   - PowerShell: `"data:image/png;base64,$([Convert]::ToBase64String([IO.File]::ReadAllBytes('logo.png')))"`
3. 開啟 `.kiro/assets/doc-style.css`，把 `:root` 內 `--doc-logo` 的 `url("data:image/…")` 整段換成新字串。
4. 不顯示 logo：`--doc-logo: none`；調整大小：`--doc-logo-height`。

> 不建議改用外部路徑（`url("./logo.png")`）：HTML 常被搬移或寄送，相對路徑會失效。範本原始檔在外掛安裝目錄 `media/doc-style.template.css`，重跑指令即可還原。

## Version 0.1.4

This release focuses on HTML and Markdown opening behavior.

- `.html` files open with HTML Visual Editor by default after installation.
- `.md` files open with HTML Visual Editor by default after installation.
- Opening a Markdown file converts it to editable HTML in the visual editor.
- Markdown files show a `轉存html` button in the toolbar.
- Clicking `轉存html` exports the edited content to a same-name `.html` file.
- In Markdown mode, `Ctrl+S` also exports HTML instead of writing HTML back into the `.md` source file.
- HTML-to-Markdown sync output now uses stable `*italic*`, `- list`, and single-space numbered-list formatting.

## Installation

Install the packaged VSIX file:

```bash
code --install-extension html-visual-editor-0.1.5.vsix
```

Or install from the VS Code / Kiro Extensions view:

1. Open Extensions.
2. Choose `Install from VSIX...`.
3. Select `html-visual-editor-0.1.5.vsix`.
4. Reload the editor if prompted.

If your editor already has a user-defined `workbench.editorAssociations` setting for `.html` or `.md`, that user setting takes priority. Remove the old association if the files do not open with HTML Visual Editor by default.

## Usage

Open any `.html` or `.md` file. The extension registers `HTML Visual Editor` as the default editor for both file types.

For Markdown files:

1. Open the `.md` file.
2. Edit visually or in the source pane.
3. Click `轉存html` to create or update the matching `.html` file.

Example:

- Open `guide.md`.
- Click `轉存html`.
- The extension writes `guide.html` in the same folder.

## Development

```bash
npm install
npm run build
npm test
```

Package a release:

```bash
npx vsce package
```
