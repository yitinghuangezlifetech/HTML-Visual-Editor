# 實作任務：匯出 HTML 主題樣式（export-theme）

## 任務清單

- [x] 1. Extension Host：新增 `src/extension/utils/theme.ts` — `DEFAULT_THEME_CSS`「規格藍」主題常數（含 `.ve-block` 中性規則、深色模式、列印）、`resolveThemeCss()` 向上查找 `.kiro/assets/doc-style.css`（找到即完整取代、失敗 fallback 內建、`</style` 轉義）、`buildHtmlDocument()` 包裝與注入（完整文件 passthrough）
- [x] 2. Extension Host：`extension.ts` — `toHtmlDocument()` 委派 `buildHtmlDocument()` 並加 css 參數；`save`／`exportHtml`／`getEditorHtml` 三處以 `resolveThemeCss(document.uri.fsPath, workspaceRoot)` 帶入主題
- [x] 3. Extension Host：`utils/markdownToHtml.ts` — 移除內嵌紫色 CSS，改用 `theme.ts` 主題來源（`css` 參數可覆寫，預設 `DEFAULT_THEME_CSS`）
- [x] 4. 測試：新增 `src/extension/__tests__/theme.test.ts`（fragment 注入、`<!doctype` passthrough、外部 CSS 查找／fallback／轉義）；`npm run build` 與 jest 通過
- [x] 5. 手動測試：F5 開發主機以 `CLAUDE.md` 重存驗證主題（含瀏覽器深色模式、列印預覽）；更新 `dash.md` 與 `.kiro/spec/03-features.md`

## 落地註記

- 任務 2 實際涵蓋**四**處呼叫點：除原列的 `save`／`exportHtml`／`getEditorHtml` 外，`activate()` 內 `onDidSaveTextDocument` 的 .md→.html 自動轉存路徑（design 現況表未列，實作時發現）亦已帶入 `resolveThemeCss()`。
- `npm run build`（esbuild）與 jest 於雲端環境驗證通過（4 套件 40 測試）；`tsc --noEmit` 僅回報三筆既有錯誤（`HtmlEditorProvider.ts`、`extension-simple.ts`、`extension.ts` 既有介面宣告），非本次變更引入。
