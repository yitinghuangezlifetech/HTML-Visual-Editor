# dash.md — 進度儀表板

> 完成 Spec 文件、功能或 API 變更時，**必須更新本檔**（見 `.kiro/steering/basic.md` Section 4.3）。
> 最後更新：2026-06-08

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

## Spec 文件狀態（specs/）

| 模組 | 位置 | requirements | design | tasks |
|------|------|:---:|:---:|:---:|
| panel-layout    | `specs/panel-layout/`    | ✅ | ✅ | ✅ |
| file-attachment | `specs/file-attachment/` | ✅ | ✅ | ✅ |
| search-replace  | `specs/search-replace/`  | ✅ | ✅ | ✅ |

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

---

## 下一步

1. ✅ **search-replace 已完成**（2026-06-17）：搜尋區塊取代功能
2. 補充 Phase 2（視覺選取）的 `specs/{feature}/requirements.md`，啟動 Spec-First 流程。
3. 整併進入點：確認 `extension.ts` vs `extension-simple.ts`、`main.ts` vs `simple-main.ts` 的正式版本。
