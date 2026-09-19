# 任務：表格標頭語意化（Table Header）

對應：`requirements.md` / `design.md`

- [x] T1 安裝相依：`turndown-plugin-gfm@^1.0.2`（`@types/turndown-plugin-gfm` registry 不存在 → 改以 `require` + 就地型別標註）
- [x] T2 新增 `src/extension/utils/tableHeader.ts`：`promoteTableHeaders(html, opts)`（parse5、快速路徑、冪等、未修改不 serialize）
- [x] T3 `theme.ts` `buildHtmlDocument()` 於 passthrough 判斷後呼叫 `promoteTableHeaders()`
- [x] T4 `htmlToMarkdown.ts`：`use(gfm.tables)`、`remove(['style','script','title','meta','link'])`、轉換前 `promoteTableHeaders(html, { minRows: 1 })`
- [x] T5 新增 `src/extension/__tests__/tableHeader.test.ts`（9 案例：含 design §4 八項 ＋「table 直接掛 tr」）
- [x] T6 `src/extension/__tests__/theme.test.ts` 增補：fragment 含表格→輸出含 thead；完整文件→不改寫
- [x] T7 `src/extension/__tests__/htmlToMarkdown.test.ts` 增補（既有檔案，非新增）：GFM 表格、無 thead 表格、單列表格、CSS/title 不外洩、script 不外洩
- [x] T8 `npm test`（6 suites / 60 tests 全過）與 `npm run build` 通過
      註：`npx tsc --noEmit` 有 3 處**既有**錯誤（`extension-simple.ts:80`、`extension.ts:12`、`HtmlEditorProvider.ts:14`），與本 spec 無關；本次新增／修改的三個檔案零型別錯誤
- [x] T9 實測：以真實匯出管線產生 HTML 並於 Chrome 渲染，淺色／深色模式表頭皆呈現主題樣式（藍底粗體）
- [x] T10 更新 `.kiro/steering/dash.md` Spec 文件狀態表（新增 table-header 列）

## 修訂：載入編輯器時降級（0.1.9）

- [x] D1 新增 `demoteTableHeaders()`：`thead > th` → `tbody > td`（移除 `scope`，其餘屬性保留，無 tbody 時自動建立）
- [x] D2 `promote` / `demote` 抽出共用骨架 `transformTables()`（解析 → 逐 table 套用 → 有改動才序列化）
- [x] D3 `extension.ts` `getEditorHtml()` 於送進 Webview 前呼叫 `demoteTableHeaders()`（`.md` 與 `.html` 兩條路徑皆涵蓋）
- [x] D4 測試：降級 6 案例 ＋ 往返 2 案例（`promote(demote(x)) === x`、多輪不累積差異），`npx jest` 72 項全過
- [x] D5 實測：以真實 Quill 2 於瀏覽器載入，確認 thead 版每列儲存格數 `[1,3,3]`（表頭被壓成一格），
      降級後為 `[3,3,3]`

## 修訂：完整 HTML 文件分支（0.1.8）

- [x] R1 `promoteTableHeaders()` 依內容形狀改用 `parse()`（完整文件）／`parseFragment()`（fragment）
- [x] R2 `buildHtmlDocument()` 的完整文件分支同樣呼叫 `promoteTableHeaders()`（僅改表格，不重複包裝／注入）
- [x] R3 測試修訂：原「完整文件不被改寫」斷言反轉為「同樣補上 thead 且 doctype／head／style 保留」，
      並新增「完整文件無可升級表格 → 原字串回傳」「以 `<html` 開頭無 doctype」案例（`npx jest` 64 項全過）
- [x] R4 端到端驗證：以「已含主題的完整文件 + 只有 td 的表格」跑 `buildHtmlDocument()`，
      確認 doctype／style 各 1 份、`th` 產生、`title` 保留、冪等，並於 Chrome 渲染確認表頭樣式

## 修訂：打包相依（0.1.7）

- [x] P1 `esbuild.config.js` 移除 `parse5` external —— `vsce package --no-dependencies` 不附 node_modules，
      external 的 npm 套件會在啟用時 `MODULE_NOT_FOUND` 導致擴充功能載入失敗（點檔案開不了）
- [x] P2 驗證方式：解壓 vsix 至無 node_modules 目錄，以 stub `vscode` 模組實際 `require` bundle

## 實作備註

- 掛載點選在 `buildHtmlDocument()` 內，`save` 與 `exportHtml` 兩條匯出路徑自動涵蓋，`extension.ts` 零修改
- parse5 依 HTML 規範會自動補 `tbody`，故 `<table><tr>` 形狀亦正確處理（T5 已覆蓋）
- 標頭列搬入 `thead` 後留下的空 `tbody` / `tfoot` 會一併移除
