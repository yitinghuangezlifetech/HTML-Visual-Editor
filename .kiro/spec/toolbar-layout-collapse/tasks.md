# 實作任務：工具列版面調整與收合（toolbar-layout-collapse）

> 對應：[requirements.md](./requirements.md)｜[design.md](./design.md)

## 任務清單

- [x] 1. Extension Host / HTML：topbar 移除 `saveBtn`、`exportHtmlBtn`、`toggleSourceBtn`，只留標題與狀態
- [x] 2. Extension Host / HTML：右側 `panel-header` 於 `btnPreview` 後加分隔線與上述三顆按鈕（ID 沿用，改掛 `.hdr-btn`）
- [x] 3. Extension Host / HTML：`#tableBar` 與 `#blockBar` 合併為 `#toolsBar`，加入 `#toolsToggle`、`.tools-group`、`#fmtToggle`，popover 留在行內
- [x] 4. Extension Host / CSS：新增 `.hdr-btn`／`.hdr-btn.save`／`.hdr-btn.export`、`.tools-group`、`#toolsBar.collapsed .tools-group`、`.t-btn.toggle`、`.ql-toolbar.ql-snow.collapsed`；修改 `.panel-header`／`.table-bar` 加 `flex-wrap`、`.table-popover` 定位、移除綁 `.topbar` 的按鈕樣式
- [x] 5. Extension Host / 訊息：新增 `uiState` 分支寫入 `globalState`；`init` payload 追加 `uiState`
- [x] 6. Webview：DOM refs 改為 `toolsBar`／`toolsToggle`／`fmtToggle`，移除 `tableBar`／`blockBar`
- [x] 7. Webview：Rich/Preview 切換改用 `toolsBar.style.display`
- [x] 8. Webview：新增 `ui` 狀態、`applyUiState()`、`persistUiState()`，改寫 `toggleSourceBtn` handler，綁定兩顆收合鈕
- [x] 9. Webview：`init` 處理套用 `payload.uiState`
- [x] 10. 驗證：`npm run build` 通過、`npm test`（jest）全數通過
- [x] 11. 文件同步：更新 `.kiro/steering/tech.md` 協定表、`.kiro/steering/dash.md`、`.kiro/spec/03-features.md`
- [ ] 12. 手動測試（使用者於 Extension Development Host 執行）：
  - [ ] Save／轉存html／收闔原始碼 位於 Preview 右方且功能正常，`Ctrl+S` 正常
  - [ ] 左側收合後兩顆按鈕仍可見可用
  - [ ] 表格＋區塊同一行，收合鈕可收合／展開，插入表格 popover 定位正確
  - [ ] 文字工具列收合鈕正常，收合後編輯區擴張且內容／游標／undo 不受影響
  - [ ] 關閉檔案重開，三項收合狀態維持
  - [ ] 30/50/70 三種寬度下 panel-header 與工具列不破版
