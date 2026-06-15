# 實作任務：Tauri 獨立執行檔（Windows .exe）

## 前置準備

- [ ] 0.1 安裝 Rust toolchain：`rustup` + `cargo`（一次性，約 1.5GB）
- [ ] 0.2 安裝 Tauri CLI：`npm install -g @tauri-apps/cli`
- [ ] 0.3 確認 WebView2 環境（Windows 10+ 通常已內建）

---

## Phase 1：專案骨架

- [ ] 1.1 建立新專案：`npm create tauri-app@latest tauri-html-editor`
  - 前端框架選 Vite + Vanilla TypeScript
- [ ] 1.2 設定 `tauri.conf.json`：視窗標題、大小（1400×900）、bundle target（`nsis` + portable）
- [ ] 1.3 確認 `npm run tauri dev` 能啟動空白視窗

---

## Phase 2：Rust Commands

- [ ] 2.1 實作 `read_file(path: String) -> Result<String, String>`
- [ ] 2.2 實作 `write_file(path: String, content: String) -> Result<(), String>`
  - 同步呼叫 `.md` 輸出邏輯
- [ ] 2.3 實作 `read_dir(dir_path: String) -> Result<Vec<String>, String>`
  - 過濾只回傳 `.html` 檔案
- [ ] 2.4 實作 HTML → Markdown 轉換（引入 `htmd` crate 或前端 `turndown.js`）
- [ ] 2.5 在 `main.rs` 註冊所有 commands（`invoke_handler`）

---

## Phase 3：前端佈局

- [ ] 3.1 建立三欄 HTML 結構（`index.html`）
  - `#sidebar`（200px）、`#sourceArea`、`#editor`、`#preview`
- [ ] 3.2 移植現有 CSS 樣式（工具列、分割線、編輯器配色）
- [ ] 3.3 加入 Quill 依賴（`npm install quill`）並確認初始化正常

---

## Phase 4：Sidebar（Workspace 檔案清單）

- [ ] 4.1 建立 `sidebar.ts`
- [ ] 4.2 「開啟資料夾」按鈕：呼叫 `@tauri-apps/plugin-dialog` 選取資料夾
- [ ] 4.3 呼叫 `invoke('read_dir')` 取得清單並渲染檔案列表
- [ ] 4.4 點擊檔案項目：呼叫 `invoke('read_file')` 載入內容
- [ ] 4.5 `dirty` 狀態管理：編輯後標示 `●`，儲存後清除

---

## Phase 5：編輯器核心邏輯

- [ ] 5.1 建立 `main.ts`，移植 `rich-editor.ts` 核心邏輯
  - 移除所有 `acquireVsCodeApi` / `postMessage` 呼叫
  - 替換為 `@tauri-apps/api/core` 的 `invoke`
- [ ] 5.2 左右雙向同步（sourceArea ↔ Quill ↔ preview）
- [ ] 5.3 `Ctrl+S` 儲存：呼叫 `invoke('write_file', { path, content })`
- [ ] 5.4 切換模式（Rich / Preview）
- [ ] 5.5 視窗標題動態更新（顯示目前檔案名稱）

---

## Phase 6：單檔開啟支援

- [ ] 6.1 「開啟檔案」按鈕：`dialog.open({ filters: [{ extensions: ['html'] }] })`
- [ ] 6.2 開啟單一 `.html` 後，sidebar 顯示該檔案所在資料夾清單

---

## Phase 7：打包與測試

- [ ] 7.1 執行 `npm run tauri build`，產出 `.exe`
- [ ] 7.2 確認執行檔大小 ≤ 20MB
- [ ] 7.3 在未安裝 VS Code / Node.js 的環境測試雙擊啟動
- [ ] 7.4 完整功能驗收（對照 requirements.md 驗收條件逐項確認）：
  - [ ] 開啟資料夾 → 顯示檔案清單
  - [ ] 點擊切換檔案，內容正確載入
  - [ ] 左右雙向同步
  - [ ] `Ctrl+S` 儲存，`.html` 正確覆寫
  - [ ] 同目錄產生 `.md`
  - [ ] 未儲存標示 `●` 正常顯示
  - [ ] 切換 Rich / Preview 正常

---

## 備註

- 本方案為**獨立新專案**，建議目錄：`d:/tauri-html-editor/`
- 不修改現有 `d:/html-visual-editor/` 的任何程式碼
- 每個 Phase 完成後執行 `npm run tauri dev` 驗證，避免累積問題
