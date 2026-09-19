# dash.md — 進度儀表板

> 完成 Spec 文件、功能或 API 變更時，**必須更新本檔**（見 `.kiro/steering/basic.md` Section 4.3）。
> 最後更新：2026-09-19

---

## 功能藍圖進度

| Phase | 狀態 | 內容 |
|-------|------|------|
| Phase 1 — 基礎編輯器 | 🟡 進行中 | 自訂編輯器、即時預覽、存檔同步、Undo/Redo |
| Phase 2 — 視覺選取 | ⚪ 規劃中 | 視覺元素選取、選取覆蓋層、文字編輯模式 |
| Phase 3 — 拖放與元件庫 | ⚪ 規劃中 | 拖放排序、元件庫、拖元件到畫布 |
| Phase 4 — 檢查器面板 | ⚪ 規劃中 | DOM 樹檢查器、CSS 樣式面板、元素屬性面板 |

圖例：✅ 完成　🟡 進行中　⚪ 規劃中

---

## Phase 1 細項

- [x] `.html` 自訂編輯器（`CustomEditorProvider`）
- [x] iframe 即時預覽
- [x] 存檔同步（`.html` ↔ `.md`）
- [x] Undo/Redo（`HistoryManager`）
- [x] Quill 富文字編輯器（右側）
- [x] 雙向同步（sourceArea ↔ Quill ↔ preview）
- [x] 搜尋、字體縮放、面板寬度調整

---

## Spec 文件狀態（.kiro/spec/{feature}/）

> 新功能規格與 `.kiro/spec/` 既有專案文件（01~05）同層放置，各功能各自一個子目錄。

| 模組 | 位置 | requirements | design | tasks |
|------|------|:---:|:---:|:---:|
| panel-layout    | `.kiro/spec/panel-layout/`    | ✅ | ✅ | ✅ |
| file-attachment | `.kiro/spec/file-attachment/` | ✅ | ✅ | ✅ |
| tauri-standalone-exe | `.kiro/spec/tauri-standalone-exe/` | ✅ | ✅ | ✅ |
| search-replace  | `.kiro/spec/search-replace/`  | ✅ | ✅ | ✅ |
| text-color-block-background | `.kiro/spec/text-color-block-background/` | ✅ | ✅ | ✅ |
| export-theme | `.kiro/spec/export-theme/` | ✅ | ✅ | ✅ |
| theme-template | `.kiro/spec/theme-template/` | ✅ | ✅ | ✅ |
| table-header | `.kiro/spec/table-header/` | ✅ | ✅ | ✅ |
| toolbar-layout-collapse | `.kiro/spec/toolbar-layout-collapse/` | ✅ | ✅ | ✅ |

---

## 既有規格文件（.kiro/spec/）

| 文件 | 內容 | 狀態 |
|------|------|:---:|
| 01-overview.md | 專案概述、技術架構 | ✅ |
| 02-development.md | 環境、編譯、打包、調試 | ✅ |
| 03-features.md | 功能說明 | ✅ |
| 04-troubleshooting.md | 常見問題 | ✅ |
| 05-history.md | 開發歷程與決策 | ✅ |

---

## 迭代時間線

| 階段 | 日期 | 成果 |
|------|------|------|
| Phase 1 | 2026-06-04 | 基礎結構、Extension Host、CustomEditorProvider |
| Phase 2 | 2026-06-05 | Webview UI、編輯／預覽、儲存功能 |
| Phase 3 | 2026-06-05 | Kiro 整合、測試、Quill 富文字編輯器 |
| 維護 | 2026-06-07 | 排除 webview 顯示問題、還原至 Quill 架構、加入 .md 同步 |
| steering 建立 | 2026-06-08 | 依 CLAUDE.md 規範建立 `.kiro/steering/` 五份文件 |
| v0.1.1 | 2026-06-11 | 面板 30/70 配置、檔案附加、圖片顯示與調整、測試框架 |
| v0.1.2 | 2026-06-13 | source↔Quill 雙向即時同步、Quill 表格編輯功能 |
| v0.1.3 | 2026-06-15 | 表格尺寸改為編輯器內嵌彈窗（避開 webview prompt 限制） |
| search-replace | 2026-06-17 | HTML 搜尋區塊添加取代功能（替本筆、替All）、自動同步 |
| steering 修正 | 2026-07-02 | 統一新功能規格路徑為 `.kiro/spec/{feature}/`（原 `specs/` 與實際存放位置不一致），搬移 `search-replace`；新增 `text-color-block-background` 需求文件 |
| export-theme | 2026-07-16 | 匯出／存檔 HTML 內嵌「規格藍」主題（四處轉換路徑統一），支援 `.kiro/assets/doc-style.css` 覆寫；新增 theme.ts 與 jest 測試 |
| toolbar-layout-collapse | 2026-09-19 | Save／轉存html／收闔原始碼移至 Preview 右方；表格＋區塊併為單行並可收合；Quill 文字工具列可收合；三項收合狀態以 `globalState` 持久化（新增 `uiState` 訊息）。build + jest 72 測試通過，待 F5 實機驗證 |
| theme-template（v0.1.5） | 2026-07-16 | 主題範本檔納入 vsix＋建立指令＋README 說明（logo 置換路徑）＋母版加 EZLife logo 同步三專案；封裝 0.1.5 |

---

## 下一步

1. ✅ **search-replace 已完成**（2026-06-17）：搜尋區塊取代功能
2. 🟡 **text-color-block-background 進行中**：程式碼已實作（任務1~5）並通過 `npm run build`；任務6（clipboard 還原）與任務7（F5 手動煙煙測試、更新本檔）待使用者於 Extension Development Host 實機驗證後標記完成
3. ✅ **export-theme 已完成**（2026-07-16）：匯出／存檔 HTML 統一內嵌「規格藍」主題，支援 `.kiro/assets/doc-style.css` 外部覆寫；jest 40 測試＋esbuild 通過，使用者實機驗證完成。腳本端（srs_sdd_bridge.py×2、md2html_specs.py）與三專案母版（範本/kikkoman/ezSport）已同步落地
4. ✅ **theme-template 已完成**（2026-07-16）：範本檔納入 vsix（media/doc-style.template.css）＋「建立文件主題範本」指令＋README 主題章節（含 logo 置換路徑）＋母版加 EZLife logo（--doc-logo 變數、72px WebP 15KB）並同步三專案；封裝 0.1.5 vsix。待使用者本機安裝 0.1.5 實測指令與 logo 顯示
4. 補充 Phase 2（視覺選取）的 `.kiro/spec/{feature}/requirements.md`，啟動 Spec-First 流程。
5. 整併進入點：確認 `extension.ts` vs `extension-simple.ts`、`main.ts` vs `simple-main.ts` 的正式版本。
