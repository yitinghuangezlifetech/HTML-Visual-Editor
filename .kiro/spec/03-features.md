# 功能說明

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

## 鍵盤快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Ctrl+S` | 儲存（同時輸出 .md） |
| `Ctrl+F` | 搜尋（依焦點決定左／右面板） |
| `Enter` / `Shift+Enter` | 搜尋下一個／上一個 |
| `Esc` | 關閉搜尋 |
| `Tab`（原始碼區） | 插入兩個空格 |

## 儲存與 Markdown 同步

儲存時：
1. 若內容非完整文件，自動包成 `<!DOCTYPE html>…` 結構
2. 寫入原 `.html` 檔
3. 用 `htmlToMarkdown` 轉換並寫入同名 `.md`
4. 回傳狀態顯示「✓ 已保存」

> 另有 workspace 層級的自動同步：儲存 `.html` 自動更新 `.md`，儲存 `.md` 自動更新 `.html`。

## Rich / Preview 切換

- **Rich**：Quill 富文字編輯器，直接編輯內容
- **Preview**：iframe 純預覽，支援連結點擊（外部連結用瀏覽器開、相對連結在編輯器開）

## WYSIWYG 設計說明

右側採用 **Quill 富文字編輯器**作為視覺編輯方案，取代早期嘗試的 iframe `designMode` / `contenteditable` 方案（後者在 VS Code 巢狀 webview 下初始化不穩定，詳見 [05-history.md](05-history.md)）。
