# 需求：表格標頭語意化（Table Header）

## 背景

Quill 內建 table 模組產生的表格只有 `<tbody><tr><td>`，不含 `<thead>` / `<th>`。
`轉存html` 是把編輯器 HTML 原樣包進主題（`extension.ts` `saveHtmlExport()` → `buildHtmlDocument()`），
而內建主題「規格藍」的表頭樣式（藍色漸層底、深藍粗體字、2px 底線）綁在 `th` 選擇器上（`theme.ts` §`th`），
選不到元素，於是第一列退化成一般資料列 —— 匯出檔的表格「標頭與欄位內容長得一樣」。

同時 `htmlToMarkdown()` 的 turndown 未掛 GFM plugin，表格會被拆成散落文字，
HTML→MD 自動同步等同破壞表格；反向 `markdownToHtml()`（marked，GFM）卻能正確產生 `<thead>/<th>`。
造成「MD 轉來的 HTML 表頭正常、編輯器直接轉存的表頭不正常」的路徑不一致。

## 使用者故事

- 身為文件維護者，我希望在視覺編輯器插入的表格，轉存 HTML 後第一列自動呈現為表頭（藍底粗體），以便產出檔與 Markdown 轉來的文件外觀一致，不需手動改 HTML。
- 身為文件維護者，我希望匯出的表格 HTML 語意正確（`thead` / `th`），以便複製到 Word／Excel 時仍被辨識為標頭列、螢幕閱讀器可正確朗讀、列印跨頁時可重複標頭。
- 身為雙向同步使用者，我希望 `.html` 存檔連動產生的 `.md` 保留表格（GFM 表格語法），以便同步不再破壞既有表格內容。

## 驗收條件

- [ ] `exportHtml`（手動轉存）與 `save` 連動轉存產生的 HTML，每個 `<table>` 的第一列 `<tr>` 之 `<td>` 轉為 `<th>` 並包進 `<thead>`，其餘列留在 `<tbody>`
- [ ] 儲存格既有的屬性（`data-row`、`colspan`、`rowspan`、`style`、`class` 等）與內層 HTML 內容於轉換後完整保留
- [ ] 表格已含 `<thead>` 或已含 `<th>` 時不做二次處理（冪等：對同一份 HTML 重複轉存結果一致）
- [ ] 表格僅有一列時不升級為 `thead`（避免整張表變成標頭）
- [ ] 內容本身已是完整 HTML 文件（`<!doctype` / `<html` 開頭）時**同樣補上表頭**，但不重複包裝、不重複注入樣式，且 doctype／`<head>`／既有 `<title>`／`<style>` 原樣保留

  > 修訂（實測後）：初版此條寫的是「完整文件不做表頭改寫」，實際上 Webview 送出的 `sourceArea.value`
  > 幾乎都是完整文件（`.html` 原檔本身即完整文件；`.md` 由 `markdownToHtml()` 產生），
  > 只處理 fragment 分支等同功能完全不生效。改為兩種形狀都處理。
- [ ] `htmlToMarkdown()` 掛上 GFM 表格支援：含 `thead/th` 的表格轉出標準 GFM 表格（`| 模組 | 說明 |` + `| --- | --- |`），無 `thead` 的表格亦不被拆成散落文字
- [ ] 匯出檔在瀏覽器淺色／深色模式下，表頭皆有可辨識的底色與字重（沿用 `theme.ts` 既有 `th` 樣式，不改主題 CSS）
- [ ] 新增 `__tests__` 單元測試涵蓋：一般表格升級、已有 thead 不重複處理、單列表格不升級、屬性保留、HTML→MD 表格往返
- [ ] `npm run build` 與 `npm test` 通過；完成 `basic.md` §2.4 煙霧測試清單
- [ ] 實測：於編輯器插入 3×2 表格 → 轉存 HTML → 瀏覽器開啟，第一列呈現主題表頭樣式

## 範圍外（Out of Scope）

- Quill 編輯器內「插入表格時直接建立 `th`」的編輯體驗改造（此版僅在匯出／轉換階段補語意，編輯器內部仍為 `td`）
- 編輯器工具列的「切換標頭列／設定標頭欄」互動功能
- 表頭欄（第一直欄為 `th scope="row"`）的處理，僅處理標頭列
- 合併儲存格（`colspan`/`rowspan`）跨列的複雜表頭推斷，僅原樣保留屬性
- 主題 CSS 表格樣式的重新設計（`theme.ts` 的 `th` / `td` 樣式維持現狀）
- 既有已產出 `.html` 的批次回填（重新轉存即套用）
