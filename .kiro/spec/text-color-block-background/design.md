# 技術設計：文字顏色編輯與區塊底色

> 對應 `requirements.md`。Quill 版本：`quill@^2.0.3`（Parchment v3，透過 `Quill.import('parchment')` 取用）。

---

## 現況確認

- `rich-editor.ts` 第102~131行：Quill 工具列已含 `[{ color: [] }, { background: [] }]`，屬 Quill 內建**行內**（inline）文字顏色／反白色選取器，套用後會產生 `<span style="color:...">` / `<span style="background-color:...">`，可經既有 `text-change` → `getRichHtml()` → `sourceArea.value` 同步機制正確寫回原始碼（此機制與格式無關，任何 Quill format 皆會被序列化，故文字顏色本身已可用）。
- ⚠️ **既有衝突**：右側搜尋高亮（`doSearchRight` / `navigateRight` / `closeSearchRight`，第645~731行）目前借用同一個 `background` 格式做黃／橘標記，且會在開啟／關閉搜尋時執行 `quill.formatText(0, quill.getLength(), 'background', false)` 清除**整份文件**的 `background`。一旦文字底色（反白色）功能被使用者實際使用，開啟搜尋會把使用者設定的文字底色一併清空。此為本次「強化現有功能」必須一併修正的既有缺陷。
- 目前沒有「區塊容器＋底色」相關格式或工具列。

---

## Webview 變更（`src/webview/rich-editor.ts`）

### 1. 新增 3 個 Quill 自訂格式（沿用既有「覆寫 Quill formats」模式，如檔案開頭 `Link.sanitize` / `ImageBlot.sanitize` 的作法）

| 格式名稱 | 型別 | Scope | 對應 HTML | 用途 |
|---|---|---|---|---|
| `block` | 自訂 Block Blot（繼承 `Quill.import('blots/block')`） | BLOCK | `<div class="ve-block">` | 「插入區塊」產生的容器行（單行 Block，性質類似內建 `blockquote`，非可包裹多行的容器） |
| `blockBackground` | `Parchment.StyleAttributor('blockBackground', 'background', { scope: Parchment.Scope.BLOCK })` | BLOCK | 該行元素的 `style="background:...;"` | 套用於**任一**區塊行：新 `block`（div）、既有 `<p>`、標題、`blockquote` 等，滿足「插入容器」與「既有段落套用底色」兩種情境 |
| `searchMark` | `Parchment.StyleAttributor('searchMark', 'background-image', { scope: Parchment.Scope.INLINE })`，套用時以 `linear-gradient(color, color)` 包裝色值 | INLINE | `<span style="background-image:linear-gradient(...);">` | **取代**搜尋高亮目前借用的 `background`，格式名稱與 CSS 屬性皆獨立，避免與文字底色功能互相清除／覆蓋 |

三者皆於 Quill 初始化前以 `Quill.register(..., true)` 註冊。

> ⚠️ **實作時發現並修正的設計缺陷**：Parchment 的 `Registry` 以 CSS 屬性名（`keyName`）作為 HTML／貼上比對用的反查鍵值，此鍵值為**全域單一命名空間**、後註冊者覆蓋先註冊者、且**不分 BLOCK／INLINE scope**。若 `blockBackground` 或 `searchMark` 沿用 `background-color`（與 Quill 內建行內 `background` 格式相同 keyName），將導致：(1) 貼上／原始碼還原時的格式誤判，(2) 更嚴重的是**同一 DOM 節點的 `style.backgroundColor` 屬性被其中一個格式覆寫**，造成使用者實際設定的文字底色在搜尋或設定區塊底色後被靜默抹除、匯出 HTML 時遺失。因此改用互不相同的 CSS 屬性（`background` 陰影屬性、`background-image` 漸層色塊）迴避 keyName 碰撞，視覺效果不變。

### 2. 既有程式碼調整：搜尋高亮改用 `searchMark`

- `doSearchRight` / `navigateRight` / `closeSearchRight` 內所有 `quill.formatText(..., 'background', ...)` 呼叫改為 `'searchMark'`。
- 視覺效果（黃 `#ffeb3b` / 橘 `#ff9800`）不變，僅格式名稱替換，行為不受影響。

### 3. 文字顏色／底色：新增自訂 Hex 色票

- Quill 的 `container: [...]` 陣列設定會自動產生整個 `.ql-toolbar` DOM（目前 `extension.ts` 的靜態 HTML 樣板並未預留 Quill 工具列容器），因此新增控制項需在 `new Quill(...)` 執行後，以 DOM API 動態插入 Quill 官方建議的擴充方式：
  ```
  const toolbarEl = quill.getModule('toolbar').container;
  ```
- 於 `toolbarEl` 內既有的顏色群組後方，動態插入兩個原生 `<input type="color">`：
  - `id="customTextColor"`（title="自訂文字顏色"）→ `input` 事件呼叫 `quill.format('color', value)`
  - `id="customTextBg"`（title="自訂文字底色"）→ `input` 事件呼叫 `quill.format('background', value)`
- 原生 `<input type="color">` 本身即含色盤＋Hex 輸入，不需透過 `inputBox` postMessage 往返 Extension Host（原生 input 不受 VS Code webview 的 `prompt()` 封鎖限制）。
- 點擊 `<input type="color">` 會使 Quill 編輯器失焦、清除選取範圍，需沿用 table 模組既有的 `lastRange` / `restoreSelection` 機制（第178~194行），在套用格式前先恢復選取範圍。

### 4. 新增「區塊」工具列列（沿用 `.table-bar` 的樣式/結構模式）

`extension.ts` 的 Webview HTML 樣板新增一列（緊接在 `.table-bar` 之後），對應 CSS 沿用 `.table-bar` / `.t-btn` 樣式：

```html
<div class="table-bar" id="blockBar">
  <span class="table-bar-label">區塊:</span>
  <button class="t-btn" id="blkInsert" title="插入區塊">⬛ 插入區塊</button>
  <div class="win-sep"></div>
  <label class="t-btn" title="設定底色" style="display:flex;align-items:center;gap:4px;">
    底色 <input type="color" id="blkBgColor" style="width:22px;height:18px;padding:0;border:none;">
  </label>
  <button class="t-btn" id="blkBgClear" title="清除底色">清除底色</button>
</div>
```

行為：
- `blkInsert`：沿用 `restoreSelection(true)` 恢復/取得游標位置後，於游標處插入新行並套用 `block` 格式（`quill.insertText(index, '\n', 'block', true, 'user')` 後將游標移入新行），使用者可直接輸入內容。
- `blkBgColor`（`input` 事件）：`restoreSelection(false)` 恢復選取範圍後，先對目前所在行／選取範圍呼叫 `quill.format('block', true)`（確保既有段落也套用 `block` 格式，取得與新插入區塊一致的視覺框線），再呼叫 `quill.format('blockBackground', value)`。
- `blkBgClear`：`quill.format('blockBackground', false)`（保留 `block` 格式，僅清除底色）。

> ⚠️ **實測發現並修正**：初版遺漏 `.ve-block` 的 CSS，導致空區塊（未輸入內容、未設底色時）沒有 `min-height`／邊框，在頁面上完全不可見，使用者點擊「插入區塊」後感覺「無法圈出區塊」。已於 `extension.ts` 補上 `.ql-editor .ve-block { min-height:1.6em; padding:8px 10px; margin:6px 0; border:1px dashed #b8b8b8; border-radius:4px; }`（hover/focus-within 時邊框變色）。此邊框僅為**編輯器內的輔助視覺**（scoped 在 `.ql-editor` 內），不會出現在儲存後的 HTML 或 Preview／最終渲染結果中。同時修正「選取既有段落設定底色」流程，一併套用 `block` 格式，使其與新插入區塊有一致的可視化框線。
- 顯示邏輯與 `tableBar` 相同：於 `setRichMode()` 中隨 Rich／Preview 模式切換顯示或隱藏（Preview 模式隱藏）。
- 三個操作完成後皆比照 `tableOp()` 現有模式，同步 `sourceArea.value = getRichHtml()`、觸發 `schedulePreview()`、標記 `isDirty`。

### 5. Source → Quill 反向同步相容性

- `scheduleSourceToQuill()` / `loadHtml()` 皆呼叫 `quill.clipboard.dangerouslyPasteHTML()` 將原始碼字串轉回 Quill 內部結構。
- 經比對 `quill`/`parchment` 原始碼（`Registry.query()` 對 Element 節點優先以 class 比對 `this.classes[className]`，`clipboard.js` 的 `matchBlot` 即呼叫 `scroll.query(node)`）：`<div class="ve-block">` 會因 `BlockContainer` 註冊時的 `className: 've-block'` 被正確比對回 `block` 格式，**不需**額外的 `clipboard.addMatcher()`。
- `blockBackground`／`searchMark` 的樣式屬性（`background`／`background-image`）比對走 `matchAttributor`（依 `keyName` 反查），因已改用不與內建格式衝突的 keyName（見上一節說明），還原時不會誤判為內建 `background`。
- 上述為原始碼層級的推論驗證，仍需以實機手動測試（F5 + Extension Development Host）做最終確認，見 `tasks.md` 第6項。

---

## Extension Host 變更（`src/extension/extension.ts`）

- **僅新增靜態 HTML／CSS**：`.block-bar`（若與 `.table-bar` 樣式相同可直接複用 class，不需新增 CSS 規則）與上述三個元素 ID。
- **不新增任何 postMessage 訊息類型**：文字顏色、區塊底色皆為 Quill 內部格式操作＋既有 `sourceArea` 同步機制，不需 Extension Host 參與（與既有 `inputBox`／`attachFile` 等機制不同，原生 `<input type="color">` 已可在 Webview 內完成取色）。
- `src/extension/HtmlEditorProvider.ts` 為未實際使用的舊檔（實際生效的是 `extension.ts` 內嵌的 `HtmlEditorProvider` class），本次不予變更；此為既有結構問題，超出本次範圍。

---

## 通訊協定

無新增 `postMessage` 訊息類型。所有互動皆在 Webview 端完成，經既有「Quill `text-change` → `sourceArea.value` → `schedulePreview()`」管線同步至原始碼與預覽，符合 `.kiro/steering/tech.md` 現有協定表，無需更新該表。

---

## 影響範圍

| 檔案 | 變更內容 |
|---|---|
| `src/webview/rich-editor.ts` | 註冊 `block`／`blockBackground`／`searchMark` 三個 Quill 格式；搜尋高亮改用 `searchMark`；動態插入文字顏色/底色自訂色票；新增區塊工具列事件處理（插入、設底色、清除底色）；`setRichMode()` 加入 `blockBar` 顯示切換 |
| `src/extension/extension.ts` | Webview HTML 樣板新增 `blockBar` 區塊列與三個元素 ID |

---

## 風險與待驗證項目

1. **Clipboard 還原正確性**：已由原始碼比對確認 `block`／`blockBackground` 的比對機制成立（見上節），仍需手動測試（插入區塊→存檔→重開檔案→確認底色與 div 結構仍保留）做最終確認。
2. **搜尋高亮格式改名**：`searchMark` 改用獨立 CSS 屬性（`background-image` 漸層）取代 `background`，需確認既有搜尋煙霧測試（`.kiro/steering/basic.md` Section 2）仍全數通過、視覺效果（黃／橘反白）不變，且不再清除使用者文字底色。
3. **`block` 為單行 Block，非多行容器**：不支援在區塊內巢狀插入表格等複雜結構，此限制已列入 `requirements.md` 範圍外。
4. **Markdown 同步**：`htmlToMarkdown` 對顏色／底色資訊會被忽略（Markdown 不支援行內樣式），此為既有轉換工具限制，非本功能需處理範圍。
