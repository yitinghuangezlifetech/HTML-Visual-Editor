# 開發歷程與決策紀錄

## 迭代時間線

| 階段 | 日期 | 成果 |
|------|------|------|
| Phase 1 | 2026-06-04 | 基礎結構、Extension Host、CustomEditorProvider |
| Phase 2 | 2026-06-05 | Webview UI、編輯／預覽、儲存功能 |
| Phase 3 | 2026-06-05 | Kiro 整合、測試、Quill 富文字編輯器 |
| 維護 | 2026-06-07 | 排除 webview 顯示問題、還原至 Quill 架構、加入 .md 同步 |

## 關鍵技術決策

### 右側編輯器：選用 Quill
早期嘗試過多種右側方案，最終定為 **Quill 富文字編輯器**：

| 方案 | 問題 | 結果 |
|------|------|------|
| Monaco Editor | CDN 載入不穩、巢狀 webview 初始化失敗 | ✗ 放棄 |
| iframe `designMode`/`contenteditable` | VS Code 巢狀 webview 下初始化延遲、事件附加不穩 | ✗ 放棄 |
| Quill (bundle) | 穩定、功能完整 | ✓ 採用 |

### Webview 三大踩雷點（務必避免）
1. **CSP 必須含 `webview.cspSource`** — 否則 `rich-editor-bundle.js` 載入失敗，畫面空白
2. **`acquireVsCodeApi()` 只能呼叫一次** — 不要在 HTML 另加 inline script，否則搶走 API 讓 bundle 失效
3. **HTML 必須提供 bundle 需要的所有元素 ID** — `sourceArea`、`editor`、`preview`、各工具列／搜尋按鈕

### iframe 預覽
- `srcdoc` 在巢狀 webview 偶爾不渲染 → 可改用 `contentDocument.write()`
- flex 佈局下 iframe 易高度塌陷 → 用絕對定位或明確高度

## 2026-06-07 維護重點

- **症狀**：重寫 `getWebviewContent` 時刪除了 bundle 依賴的元素、加了搶用 `acquireVsCodeApi` 的 inline script、CSP 拿掉 `cspSource` → 右側編輯器失效。
- **修正**：完整還原原本由 `rich-editor-bundle.js` 驅動的雙面板架構（左 `sourceArea` + 右 Quill/preview），CSP 補回 `cspSource`，移除多餘 inline script。
- **新增**：儲存時同步輸出 `.md`。

## 教訓

> 既有可運作版本出問題時，**優先還原**，不要在不了解 bundle 依賴的情況下重寫 webview HTML。修改 `getWebviewContent` 前，先確認 `rich-editor.ts` 需要哪些元素 ID 與事件。
