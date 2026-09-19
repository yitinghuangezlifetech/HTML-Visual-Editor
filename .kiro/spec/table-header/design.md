# 設計：表格標頭語意化（Table Header）

對應需求：`.kiro/spec/table-header/requirements.md`

## 1. 管線定位

```
[Webview Quill HTML]  ──save / exportHtml──▶  buildHtmlDocument()          ──▶  *.html
   (只有 tbody/tr/td)                          ├ 完整文件 → passthrough（不改表頭）
                                               └ fragment → ★promoteTableHeaders() → 包主題 <style>
                                                                                      │
                                       [*.html 全文] ──htmlToMarkdown()──▶ *.md        │
                                                       ├ ★remove(style/title/…)        │
                                                       ├ ★promoteTableHeaders()（保險） │
                                                       └ ★turndown-plugin-gfm(tables)   │
```

★＝本 spec 新增。核心是**單一轉換函式 `promoteTableHeaders()`，兩條管線共用**。

- 匯出路徑（`extension.ts` `saveHtmlExport()` / `save`）不需改動：兩者都經 `toHtmlDocument()` → `buildHtmlDocument()`，
  於 `buildHtmlDocument()` 內呼叫即涵蓋兩條路徑，`extension.ts` 零修改。
- **fragment 與完整文件兩個分支都要呼叫**：Webview 送出的是 `sourceArea.value`，
  `.html` 原檔本身即完整文件、`.md` 則由 `markdownToHtml()` 產生完整文件，
  故完整文件才是實際的主要形狀。完整文件分支僅改寫表格，不重複包裝、不注入樣式。
  對應地 `promoteTableHeaders()` 內部依 `<!doctype` / `<html` 開頭判斷改用 `parse()`；
  誤用 `parseFragment()` 解析完整文件會使 doctype 與 html/head/body 標籤在序列化時消失。
- Markdown 路徑（`markdownToHtml()`，marked GFM）本就產生 `thead/th`，函式冪等故不受影響。

### 1.1 雙向處理：載入降級 / 存檔升級

**Quill 的 table 模組只註冊 `TD` / `TR` / `TBODY` / `TABLE` 四種 blot，沒有 `TH` / `THEAD`**
（`node_modules/quill/formats/table.js`）。含 `thead` 的文件經 `dangerouslyPasteHTML()` 載入時，
表頭列的儲存格不被辨識，整列被壓成單一區塊（實測三欄表格的每列儲存格數為 `[1, 3, 3]`）。

因此語意化必須是雙向的，否則產物一回到編輯器就被打回原形：

```
檔案 / 匯出檔（thead > th）
   │  getEditorHtml() → ★demoteTableHeaders()
   ▼
Webview / Quill（tbody > td，Quill 唯一吃得下的形狀）
   │  save / exportHtml → buildHtmlDocument() → promoteTableHeaders()
   ▼
檔案 / 匯出檔（thead > th）
```

此缺陷對 `.md` 文件是**既有**問題（`markdownToHtml()` 的 marked 本就產生 `thead`），
並非只影響本 spec 新增的升級行為。

## 2. 新增模組 `src/extension/utils/tableHeader.ts`

```ts
export interface PromoteOptions {
  /** 列數少於此值的表格不升級（避免整張表變標頭）。預設 2 */
  minRows?: number;
}

/** 將每個 <table> 第一列的 <td> 升級為 <thead><th scope="col">。冪等。 */
export function promoteTableHeaders(html: string, opts?: PromoteOptions): string;
```

### 2.1 解析器選擇

用既有相依 **parse5**（`parseFragment` / `serialize`），不用正則：
Quill 表格儲存格帶 `data-row` 屬性且可含任意內層 HTML，正則處理巢狀表格與屬性引號必然出錯。

### 2.2 演算法

1. **快速路徑**：`!/<table[\s>]/i.test(html)` → 原樣回傳（絕大多數文件不含表格，避免無謂 parse/serialize）。
2. `parseFragment(html)`，深度走訪取得所有 `table` 元素。
3. 逐一 table 判斷是否跳過：
   - 已有 `thead` 直接子元素 → 跳過（冪等）
   - 自身列中已存在 `th` 儲存格 → 跳過（冪等；Markdown 產生的表格走此分支）
4. **列的蒐集只看直接結構**：table 的直接子節點 `tbody` / `tfoot` / `tr`，取其中的 `tr`；
   不做深度走訪，**巢狀表格的列不會被誤認為外層表格的列**（巢狀表格由步驟 2 各自處理）。
5. `rows.length < minRows` → 跳過。
6. 取 `rows[0]`：其儲存格全為 `td` 時，逐格改名 `td` → `th`（`tagName` / `nodeName` 同步改），
   **保留原有 `attrs` 陣列與 `childNodes`**（`data-row`、`colspan`、`rowspan`、`style`、`class` 與內層 HTML 全數不動），
   另補 `scope="col"`（原本已有 `scope` 則不覆寫）。
7. 建立 `thead` 元素，將該 `tr` 自原父節點移除後掛入 `thead`，`thead` 插入為 table 的第一個子元素；
   `parentNode` 一併維護。餘列留在原 `tbody`（parse5 依 HTML 規範會自動補 `tbody`，故 `<table><tr>` 亦成立）。
8. **有任一 table 被修改才 `serialize()`**；完全沒改則回傳原字串 —— 避免無謂的 parse5 正規化（屬性引號、實體跳脫）改動既有 HTML。

### 2.3 設計取捨

| 決策 | 理由 |
|------|------|
| 放在 `buildHtmlDocument()` 內而非 `extension.ts` | 兩條匯出路徑共用同一入口；passthrough 規則自動繼承；`extension.ts` 免改、免重複呼叫 |
| 改名 `td`→`th` 而非重建節點 | 屬性與子節點原地保留，不需複製邏輯，零遺漏風險 |
| 補 `scope="col"` | 螢幕閱讀器正確關聯欄位（需求「語意正確」的一部分），成本為零 |
| 未修改就不 serialize | 不對無表格／已語意化的文件造成任何位元差異 |
| 單列表格不升級（`minRows: 2`） | 需求明列；Markdown→HTML 路徑不受影響（marked 已產生 thead） |

## 3. `htmlToMarkdown.ts` 修改

現況缺陷（已實測 `turndown@7.2.4` 確認）：

```js
turndown('<html><head><title>CLAUDE</title><style>body{color:red}</style></head><body><p>hi</p>…')
// → "CLAUDEbody{color:red}\n\nhi"        ← 標題文字與整份主題 CSS 混入 .md
turndown('<table><thead><tr><th>a</th></tr></thead><tbody><tr><td>b</td></tr></tbody></table>')
// → "a\n\nb"                             ← 表格被拆成散落文字
```

`save` 時傳入的是**已包主題 `<style>` 的完整文件**（`extension.ts:107` `htmlToMarkdown(toWrite)`），
所以每次存檔都把整份主題 CSS 寫進 `.md`。三項修改：

1. **掛 GFM 表格規則**：新增相依 `turndown-plugin-gfm@^1.0.2`（＋ `@types/turndown-plugin-gfm`），
   `td.use(gfm.tables)`（只取 tables，不引入 strikethrough/taskListItems 以免改動既有輸出）。
2. **移除非內容節點**：`td.remove(['style', 'script', 'title', 'meta', 'link'])`。
   註：turndown 以 `div.innerHTML` 解析，`<head>`/`<body>` 標籤本身已消失、但 `<title>`/`<style>` 元素會殘留，
   故必須逐一列名，`remove(['head'])` 無效（已實測）。
3. **轉換前先 `promoteTableHeaders(html, { minRows: 1 })`**：GFM 表格語法強制需要標頭列，
   無 `thead` 的表格會產不出合法 `| --- |` 分隔列。此處 `minRows: 1` 使單列表格亦得到標頭，確保輸出永遠是合法 GFM。

其餘既有後處理（清單縮排 regex）不動。

> ⚠️ 第 2 點（`<style>`/`<title>` 混入 `.md`）是同一函式內、與表格併發的既有缺陷，
> 不修則 `.md` 仍為含整份 CSS 的髒檔。requirements 未列此條，於此併入並提請確認。

## 4. 測試設計

新增 `src/extension/__tests__/tableHeader.test.ts`（Arrange-Act-Assert，與 `theme.test.ts` 同風格）：

| # | 案例 | 斷言重點 |
|---|------|---------|
| 1 | Quill 式表格（tbody/tr/td，3 列） | 產出含 `<thead>`、第一列為 `<th scope="col">`、其餘列仍為 `td` |
| 2 | 儲存格屬性與內層 HTML | `data-row`、`colspan`、`style`、`<strong>` 子節點於升級後完整保留 |
| 3 | 已含 `<thead>` | 回傳值與輸入完全相同（`toBe`） |
| 4 | 已含 `<th>`（無 thead） | 不做二次處理 |
| 5 | 冪等 | `promote(promote(x)) === promote(x)` |
| 6 | 單列表格（預設 minRows=2） | 不升級；`minRows: 1` 時升級 |
| 7 | 無表格 HTML | 原字串回傳（`toBe`，驗證未經 serialize） |
| 8 | 巢狀表格 | 內外層各自升級，外層標頭不取到內層的列 |

`theme.test.ts` 增補：
- `buildHtmlDocument()` 傳入含 Quill 表格的 fragment → 輸出含 `<thead>`
- 完整 HTML 文件（`<!doctype` 開頭）內含無 thead 的表格 → passthrough，**不**被改寫

新增 `src/extension/__tests__/htmlToMarkdown.test.ts`：
- `thead/th` 表格 → 標準 GFM（含 `| --- |` 分隔列）
- 無 thead 表格 → 仍輸出合法 GFM 表格（不被拆成散落文字）
- 完整文件（含 `<style>` 主題與 `<title>`）→ 輸出不含 CSS 文字與標題文字
- 既有清單縮排後處理未回歸

## 5. 風險與緩解

| 風險 | 緩解 |
|------|------|
| parse5 re-serialize 造成既有 HTML 位元差異 | 未修改即不 serialize（§2.2-8）；有表格才進入解析 |
| `turndown-plugin-gfm` 無型別／CJS-ESM 互通問題 | 安裝 `@types/turndown-plugin-gfm`；若型別缺失以 `require` + 區域 `any` 收斂，不擴散型別鬆散 |
| 使用者表格第一列本就不是標頭（如純資料） | 屬視覺編輯器慣例取捨；範圍外的「切換標頭列」互動留待後續 spec |
| `remove(['title', …])` 誤刪內文中的 `<title>` | `<title>` 不是合法內文元素，Quill 不會產生 |

## 6. 不變更清單

- `theme.ts` 的 CSS（`th` / `td` 樣式沿用現狀）
- `extension.ts`（兩條匯出路徑均經 `buildHtmlDocument()`）
- `markdownToHtml.ts`
- Webview `rich-editor.ts` 與 Quill table 模組（編輯器內部仍為 `td`）
- Webview 通訊協定（無新訊息型別）
