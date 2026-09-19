# 實作任務：文字顏色編輯與區塊底色

## 任務清單

- [x] 1. Webview：註冊自訂 Quill 格式
  - 於 `rich-editor.ts` 頂部（既有 `Link.sanitize` / `ImageBlot.sanitize` 覆寫區塊附近）新增：
    - `block` Blot（繼承 `Quill.import('blots/block')`，`tagName: 'div'`，`className: 've-block'`，`blotName: 'block'`）
    - `blockBackground`：`Parchment.StyleAttributor('blockBackground', 'background-color', { scope: Parchment.Scope.BLOCK })`
    - `searchMark`：`Parchment.StyleAttributor('searchMark', 'background-color', { scope: Parchment.Scope.INLINE })`
  - 皆以 `Quill.register(..., true)` 註冊

- [x] 2. Webview：搜尋高亮改用 `searchMark`（既有程式碼調整，修正與文字底色的格式衝突）
  - `doSearchRight` / `navigateRight` / `closeSearchRight` 內所有 `quill.formatText(..., 'background', ...)` 改為 `'searchMark'`

- [x] 3. Webview：文字顏色／底色自訂 Hex 色票
  - Quill 初始化後，於 `quill.getModule('toolbar').container` 動態插入 `#customTextColor`、`#customTextBg` 兩個 `<input type="color">`
  - `input` 事件：先以既有 `lastRange` / `restoreSelection` 機制恢復選取範圍，再呼叫 `quill.format('color', value)` / `quill.format('background', value)`

- [x] 4. Extension Host：新增區塊工具列 HTML／CSS
  - `extension.ts` 的 Webview HTML 樣板，緊接 `.table-bar` 後新增區塊列（`id="blockBar"`），內含 `blkInsert`、`blkBgColor`（`<input type="color">`）、`blkBgClear`
  - 沿用 `.table-bar` / `.t-btn` 既有 CSS，不需新增樣式規則

- [x] 5. Webview：區塊工具列事件處理
  - `blkInsert`：`restoreSelection(true)` 後於游標處插入新行並套用 `block` 格式，游標移入新行
  - `blkBgColor`（`input` 事件）：`restoreSelection(false)` 後對目前行／選取範圍套用 `blockBackground`
  - `blkBgClear`：對目前行／選取範圍套用 `quill.format('blockBackground', false)`
  - 三者完成後同步 `sourceArea.value = getRichHtml()`、`schedulePreview()`、標記 `isDirty`（比照既有 `tableOp()` 模式）
  - `setRichMode()` 加入 `blockBar` 顯示切換（Rich 顯示／Preview 隱藏，比照 `tableBar`）

- [ ] 6. Clipboard 還原相容性驗證
  - 手動測試：插入區塊＋設底色 → 檢查 `sourceArea` 原始碼是否為 `<div class="ve-block" style="background-color:...">`
  - 手動測試：直接編輯 `sourceArea` 貼上／輸入含 `ve-block` 的原始碼 → 確認同步回 Quill 後正確顯示為區塊＋底色
  - 若還原失敗，於 `rich-editor.ts` 新增 `quill.clipboard.addMatcher('div.ve-block', ...)`

- [ ] 7. 建置與手動測試
  - `npm run build` 確認編譯無錯誤
  - F5 啟動 Extension Development Host，開啟 `test.html`
  - 執行 `.kiro/steering/basic.md` Section 2 既有煙霧測試（全數通過，含搜尋功能）
  - 新功能測試：
    - 選取文字套用 Quill 內建顏色／底色，確認同步至原始碼與 Preview
    - 使用自訂 Hex 色票設定文字顏色／底色
    - 插入區塊、輸入內容、設定／清除底色，確認同步至原始碼與 Preview
    - 開啟搜尋（Ctrl+F）確認不再清除已設定的文字底色
    - 儲存（Ctrl+S）後重新開啟檔案，確認顏色與區塊底色皆保留
  - 更新 `.kiro/steering/dash.md`：本功能 Spec 狀態表勾選 design/tasks 完成、迭代時間線新增紀錄
