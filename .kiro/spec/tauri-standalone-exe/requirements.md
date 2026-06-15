# 需求：Tauri 獨立執行檔（Windows .exe）

## 使用者故事

- 身為 HTML 編輯器使用者，我希望能雙擊 `.exe` 直接開啟編輯器，不需安裝 VS Code 或任何 runtime，以便在任何 Windows 電腦上使用。
- 身為使用者，我希望能開啟本機 `.html` 檔案進行視覺化編輯，並儲存回原始路徑，以便維持現有工作流程。
- 身為使用者，我希望編輯器具備與現有 VS Code 外掛相同的核心功能（左右分割、富文字編輯、即時預覽、Ctrl+S 儲存），以便無縫銜接現有習慣。

---

## 功能範圍

### 必須具備（MVP）

- [ ] 雙擊 `.exe` 啟動，無需安裝任何 runtime
- [ ] 開啟本機 `.html` 檔案（透過系統檔案選擇對話框）
- [ ] 左側：HTML 原始碼編輯區（`<textarea>`）
- [ ] 右側：Quill 富文字編輯器（WYSIWYG）
- [ ] 即時預覽（`<iframe>`，可切換 Rich / Preview 模式）
- [ ] 左右雙向同步（sourceArea ↔ Quill ↔ preview）
- [ ] `Ctrl+S` 儲存，寫回原始 `.html` 路徑
- [ ] 儲存時同步輸出同目錄 `.md` 檔案
- [ ] 視窗標題顯示目前開啟的檔案名稱
- [ ] **Workspace 模式**：以資料夾為單位開啟，左側顯示該資料夾內所有 `.html` 檔案清單，點擊切換編輯目標
- [ ] Workspace 內多檔案可快速切換，各自保有獨立編輯狀態（未儲存變更有標示）

### 次要功能（Nice to Have，非 MVP）

- [ ] 拖曳 `.html` 檔案或資料夾到視窗直接開啟
- [ ] 最近開啟的檔案 / Workspace 清單
- [ ] 視窗記憶上次大小與位置

---

## 技術限制與假設

| 項目 | 說明 |
|------|------|
| 目標平台 | Windows 10 / 11（x64） |
| WebView2 | Windows 10+ 已內建，不需額外安裝 |
| Rust toolchain | 僅開發期需要，產物不包含 |
| 執行檔大小目標 | < 20MB |
| 前端技術 | 沿用現有 Webview UI（HTML + CSS + Quill） |
| Rust 層職責 | 僅負責 `read_file`、`write_file` 兩個 command，不處理 UI 邏輯 |

---

## 驗收條件

- [ ] 在未安裝 VS Code / Kiro / Node.js 的 Windows 10+ 機器上，雙擊 `.exe` 能成功啟動
- [ ] 可透過對話框選擇並開啟任意 `.html` 檔案，內容正確顯示於左側原始碼區與右側 Quill 編輯器
- [ ] 在 Quill 或原始碼區編輯後，左右兩側保持同步
- [ ] 按 `Ctrl+S` 後，`.html` 原始檔內容被正確覆寫
- [ ] 儲存後，同目錄出現對應的 `.md` 檔案
- [ ] 切換 Rich / Preview 模式正常運作
- [ ] 可開啟資料夾作為 Workspace，左側檔案清單列出所有 `.html` 檔
- [ ] 點擊檔案清單可切換編輯目標，未儲存的檔案有明顯標示（如 `●`）
- [ ] 執行檔大小 ≤ 20MB

---

## 範圍外（Out of Scope）

- macOS / Linux 支援（本次僅 Windows）
- 自動更新機制（Tauri updater）
- 多檔案同時並排顯示（分頁或分割視窗，Workspace 內為清單切換而非並排）
- HTML 語法檢查 / Emmet
- 安裝程式（NSIS installer），本次僅產出 portable `.exe`
- 雲端儲存整合
