# product.md — 產品功能與使用者流程

> 本檔案為專案的 **source of truth** 之一。

---

## 產品定位

**HTML Visual Editor** 是一個 VS Code / Kiro 擴充功能，為 `.html` 檔案提供 **WYSIWYG 視覺編輯與即時預覽**，採左右分割視圖。目標是讓使用者能同時看到原始碼與渲染結果，並用富文字方式直接編輯內容。

- **發行者**：ezlifetech
- **版本**：0.1.0
- **負責人**：yitinghuang@ezlifetech.com.tw

---

## 使用者角色

| 角色 | 需求 |
|------|------|
| 內容編輯者 | 用富文字工具列編輯 HTML 內容，不需手寫標籤 |
| 開發者 | 同時編輯原始碼並即時預覽渲染結果 |
| 文件維護者 | 編輯 HTML 後自動產出同步的 Markdown 版本 |

---

## 介面總覽

```
┌─────────────────────────────────────────────┐
│ ✏ HTML Visual Editor   💾 Save        狀態   │
├──────────────────────┬──────────────────────┤
│  SOURCE CODE         │  Rich Text Editor     │
│  原始碼編輯           │  🖊 Rich / 👁 Preview │
│  (#sourceArea)       │  (Quill / iframe)     │
└──────────────────────┴──────────────────────┘
```

---

## 核心功能

| 功能 | 操作 | 說明 |
|------|------|------|
| 原始碼編輯 | 左側 textarea | 自由編輯 HTML，Tab 插入兩空格 |
| 富文字編輯 | 右側 Quill | 標題、字體、顏色、清單、連結、圖片等工具列 |
| 即時預覽 | 👁 Preview 切換 | iframe 渲染最終結果 |
| 雙向同步 | 自動 | sourceArea ↔ Quill ↔ preview 互相更新 |
| 儲存 | `Ctrl+S` / 💾 Save | 寫回 `.html`，並同步輸出 `.md` |
| 字體縮放 | A− / A+ | 調整原始碼字體大小（10–28px） |
| 面板寬度 | ◀30 / ⬛50 / 70▶ | 預設比例，或拖曳中間分隔線 |
| 搜尋 | `Ctrl+F` / 🔍 | 左右面板各自搜尋，Enter 跳下一個 |

---

## 鍵盤快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Ctrl+S` | 儲存（同時輸出 .md） |
| `Ctrl+F` | 搜尋（依焦點決定左／右面板） |
| `Enter` / `Shift+Enter` | 搜尋下一個／上一個 |
| `Esc` | 關閉搜尋 |
| `Tab`（原始碼區） | 插入兩個空格 |

---

## 關鍵使用者流程

### 開啟與編輯
1. 在檔案總管對 `.html` 檔右鍵 → 「Open with HTML Visual Editor」（或設為預設編輯器）。
2. 左側顯示原始碼、右側顯示 Quill 富文字編輯器。
3. 任一側編輯，另一側即時同步。

### 儲存與 Markdown 同步
儲存時：
1. 若內容非完整文件，自動包成 `<!DOCTYPE html>…` 結構。
2. 寫入原 `.html` 檔。
3. 用 `htmlToMarkdown` 轉換並寫入同名 `.md`。
4. 回傳狀態顯示「✓ 已保存」。

> 另有 workspace 層級的自動同步：儲存 `.html` 自動更新 `.md`，儲存 `.md` 自動更新 `.html`。

### Rich / Preview 切換
- **Rich**：Quill 富文字編輯器，直接編輯內容。
- **Preview**：iframe 純預覽，支援連結點擊（外部連結用瀏覽器開、相對連結在編輯器開）。

---

## 設計決策：為何採用 Quill

右側採用 **Quill 富文字編輯器**作為視覺編輯方案，取代早期嘗試的 Monaco 與 iframe `designMode`/`contenteditable` 方案（後者在 VS Code 巢狀 webview 下初始化不穩定）。完整決策紀錄見 `.kiro/spec/05-history.md`。

---

## 功能藍圖（Roadmap）

| Phase | 狀態 | 內容 |
|-------|------|------|
| Phase 1 | ✓ 進行中 | 自訂編輯器、即時預覽、存檔同步、Undo/Redo |
| Phase 2 | 規劃中 | 視覺元素選取、選取覆蓋層、文字編輯模式 |
| Phase 3 | 規劃中 | 拖放排序、元件庫、拖元件到畫布 |
| Phase 4 | 規劃中 | DOM 樹檢查器、CSS 樣式面板、元素屬性面板 |

> 進度即時狀態見 `.kiro/steering/dash.md`。
