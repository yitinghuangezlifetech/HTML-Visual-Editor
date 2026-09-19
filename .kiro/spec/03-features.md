# 功能說明

## 介面總覽

```
┌──────────────────────────────────────────────────────────────┐
│ ✏ HTML Visual Editor                                    狀態 │
├──────────────────────┬───────────────────────────────────────┤
│  SOURCE CODE         │ Rich…│🖊Rich 👁Preview│💾Save 轉存html ◀收闔原始碼│
│  原始碼編輯           ├───────────────────────────────────────┤
│  (#sourceArea)       │ ▾ 表格: … ┊ 區塊: …            ▾ 文字 │
│                      ├───────────────────────────────────────┤
│                      │ Quill 文字工具列（可收合）             │
│                      ├───────────────────────────────────────┤
│                      │ (Quill / iframe)                      │
└──────────────────────┴───────────────────────────────────────┘
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
| 收合原始碼 | 右側標題列 ◀ 收闔原始碼 | 隱藏／還原左側原始碼面板（按鈕與 💾 Save、轉存html 同列，位於 👁 Preview 右方） |
| 收合表格／區塊列 | 工具列左側 ▾ | 表格與區塊按鈕合併為同一行，一鍵收合讓出垂直空間 |
| 收合文字工具列 | 工具列右側 ▾ 文字 | 隱藏 Quill 文字工具列，編輯區向上擴張（不影響內容／游標／undo） |

> 三項收合狀態經 `uiState` 訊息存入 Extension 的 `globalState`（key `htmlVisualEditor.uiState`），
> 關閉檔案重開仍維持；此偏好為全域共用，非各檔案獨立。

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
1. 若內容非完整文件，自動包成 `<!DOCTYPE html>…` 結構，並於 `<head>` **內嵌主題樣式**（見下節）
2. 寫入原 `.html` 檔
3. 用 `htmlToMarkdown` 轉換並寫入同名 `.md`
4. 回傳狀態顯示「✓ 已保存」

> 另有 workspace 層級的自動同步：儲存 `.html` 自動更新 `.md`，儲存 `.md` 自動更新 `.html`（同樣內嵌主題樣式）。

## 匯出主題樣式（export-theme）

存檔／轉存產生的 HTML 一律內嵌主題樣式（spec：`.kiro/spec/export-theme/`）：

- **內建預設**：「規格藍」主題（`src/extension/utils/theme.ts` 的 `DEFAULT_THEME_CSS`）——Noto Sans TC、藍色標題強調線、圓角卡片表格、深色程式碼區塊、深色模式（`prefers-color-scheme`）、列印樣式，並含 `.ve-block` 中性段落規則（編輯器虛線框僅存在 webview UI，不隨匯出）。
- **外部覆寫**：自文件所在目錄向上查找 `.kiro/assets/doc-style.css`，找到即**完整取代**內建主題——與 `srs_sdd_bridge.py` 等其他轉換器共用同一份樣式來源即可達成多工具輸出一致。
- **passthrough**：內容已是完整 HTML 文件（`<!doctype` / `<html` 開頭）時維持原樣，不重複包裝、不注入。
- 開啟 `.md` 的編輯器載入（`markdownToHtml`）與匯出使用同一主題來源，所見即所得。
- **範本供裝（v0.1.5，spec：`.kiro/spec/theme-template/`）**：外掛內建範本 `media/doc-style.template.css`（含 EZLife logo 檔頭與說明註解）；指令面板「HTML Visual Editor: 建立文件主題範本 (doc-style.css)」一鍵寫入工作區 `.kiro/assets/`（既有檔先確認才覆寫）。logo 以 `--doc-logo` CSS 變數承載，置換方式見範本檔頭與 README「Logo 置換路徑」。

## Rich / Preview 切換

- **Rich**：Quill 富文字編輯器，直接編輯內容
- **Preview**：iframe 純預覽，支援連結點擊（外部連結用瀏覽器開、相對連結在編輯器開）

## WYSIWYG 設計說明

右側採用 **Quill 富文字編輯器**作為視覺編輯方案，取代早期嘗試的 iframe `designMode` / `contenteditable` 方案（後者在 VS Code 巢狀 webview 下初始化不穩定，詳見 [05-history.md](05-history.md)）。
