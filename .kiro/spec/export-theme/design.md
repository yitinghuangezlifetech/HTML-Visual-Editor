# 技術設計：匯出 HTML 主題樣式（export-theme）

## 現況與問題定位

| 位置 | 現況 | 問題 |
|------|------|------|
| `extension.ts` `toHtmlDocument()`（L28–35） | fragment 包 bare 骨架，`<head>` 無 `<style>` | 存檔／轉存產物無樣式（CLAUDE.html 案例） |
| `utils/markdownToHtml.ts` | 開啟 `.md` 載入用，內嵌紫色樣式（#667eea） | 與匯出結果外觀不一致 |
| webview `wrapHtml()`（rich-editor.ts L380） | preview iframe 用第三套簡易樣式 | 三套樣式互不一致 |
| `save` / `exportHtml` payload | 皆送 `sourceArea.value`；Quill 同步後為 body fragment（含 `.ve-block`），未編輯時可能為完整文件 | fragment 走 bare 包裝；完整文件走 passthrough |

## Extension Host 變更

1. **新增 `src/extension/utils/theme.ts`**
   - `DEFAULT_THEME_CSS`：內建「規格藍」主題常數（Noto Sans TC、藍色標題強調線、圓角卡片表格、深色程式碼區塊、琥珀引用框、`prefers-color-scheme` 深色模式、`@media print` 列印樣式），並含 `.ve-block { margin: .55rem 0 .9rem; }` 中性段落規則（編輯器的虛線框樣式僅存在 webview UI，不隨匯出）。
   - `resolveThemeCss(docUri: vscode.Uri): string`：自文件所在目錄**向上查找** `.kiro/assets/doc-style.css`（至 workspace folder 根為止；文件不在 workspace 內則設上溯層數上限），找到→讀檔回傳其內容（**完整取代**內建，不做合併）；找不到或讀檔失敗→回傳 `DEFAULT_THEME_CSS`（`console.warn`，不丟錯）。讀入內容對 `</style` 做轉義防斷。

2. **`extension.ts`**
   - `toHtmlDocument(content, title, css)`：新增第三參數；fragment 包裝時於 `<head>` 注入 `<style>\n${css}\n</style>`；內容已是完整文件（`<!doctype` / `<html` 開頭）時**維持原樣 return，不注入**（與現行一致）。
   - `save`（`.html` 寫檔與 `.md` 連動轉存）與 `exportHtml` 兩處：呼叫前以 `resolveThemeCss(document.uri)` 取得 css 傳入。
   - `getEditorHtml()`：改呼叫 `markdownToHtml(content, title, resolveThemeCss(uri))`。

3. **`utils/markdownToHtml.ts`**
   - 簽名改為 `markdownToHtml(markdown, title?, css?)`；移除內嵌紫色 CSS，`css` 未傳入時預設 `DEFAULT_THEME_CSS`（import 自 `theme.ts`）。

## Webview 變更

- **無**。本版不動 `src/webview/**`；preview iframe 的 `wrapHtml()` 樣式統一列入後續議題。
- 不違反 Webview 三大鐵則：CSP、`acquireVsCodeApi()`、元素 ID 皆不觸碰。

## 通訊協定

- **無新增訊息型別**；`save` / `exportHtml` / `init` 的 payload 格式不變。

## 一致性說明

- 編輯後存檔（fragment）→ `toHtmlDocument` 注入主題；未編輯直接存檔的 `.md`（sourceArea 為 `markdownToHtml` 產生的完整文件）→ passthrough，但因 `markdownToHtml` 已改用同一主題，兩種路徑輸出外觀一致。
- kikkoman 等專案在 `.kiro/assets/doc-style.css` 放置樣式後，本外掛與 `srs_sdd_bridge.py`、`md2html_specs.py` 即共用同一樣式來源。

## 測試

- **單元（jest）**：新增 `src/extension/__tests__/theme.test.ts`
  - fragment 包裝結果含 `<style>` 與主題內容；`<!doctype` 開頭內容 passthrough 不注入
  - `resolveThemeCss`：外部檔存在→回傳外部內容；不存在→內建；讀檔錯誤→內建
  - `markdownToHtml` 輸出含傳入 css；未傳入時含內建主題
- **手動**：`npm run build` → F5 → `basic.md` §2 煙霧測試清單；以本專案 `CLAUDE.md` 重新存檔，驗證 `CLAUDE.html` 主題、瀏覽器深色模式、列印預覽。

## 影響範圍

- 修改：`src/extension/extension.ts`、`src/extension/utils/markdownToHtml.ts`
- 新增：`src/extension/utils/theme.ts`、`src/extension/__tests__/theme.test.ts`
- 不動：`src/webview/**`（含 `wrapHtml`）、`HtmlEditorProvider.ts`（entry 未引用之遺留檔，屬既有整併議題）、`utils/htmlToMarkdown.ts`
- 文件同步（實作完成時）：`dash.md`、`.kiro/spec/03-features.md`
