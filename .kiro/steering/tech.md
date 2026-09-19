# tech.md — 技術棧與建置規範

> 本檔案為專案的 **source of truth** 之一。

---

## 技術棧

| 層 | 技術 | 說明 |
|----|------|------|
| Extension Host | TypeScript + Node.js | 運行於 VS Code / Kiro 程序，註冊自訂編輯器 |
| 自訂編輯器 | `CustomEditorProvider` | 綁定 `*.html` 檔案（`viewType: htmlVisualEditor.editor`） |
| Webview UI | HTML5 + CSS3 | 使用者介面層（左右分割） |
| 原始碼編輯 | `<textarea>`（`#sourceArea`） | 左側 HTML 代碼編輯 |
| 富文字編輯 | Quill（`#editor`） | 右側 WYSIWYG，可切換預覽 |
| 即時預覽 | `<iframe>`（`#preview`） | 渲染最終結果 |
| 編譯/打包 | esbuild | 輸出 Extension 與 Webview bundle |
| 擴充功能打包 | `@vscode/vsce` | 產出 `.vsix` |

### 主要相依套件
- **執行期（dependencies）**：`quill`、`marked`、`turndown`、`parse5`、`monaco-editor`
- **開發期（devDependencies）**：`typescript`、`esbuild`、`@vscode/vsce`、`@vscode/test-electron`、`@types/*`

> 註：`monaco-editor` 曾評估作為右側編輯器但已放棄（CDN/巢狀 webview 初始化不穩），目前正式方案為 **Quill**。詳見 `.kiro/spec/05-history.md`。

---

## 環境需求

- VS Code engine：`^1.85.0`
- 本地需安裝 Node.js + npm（**非 Docker 專案**，無需容器）
- 開發平台：Windows 11，shell 為 bash

---

## 建置指令

```bash
npm install                 # 安裝相依套件
npm run build               # 單次編譯（esbuild）
npm run watch               # 監視模式（自動重新編譯）
npm run compile             # 等同 build
```

esbuild 輸出：
- `dist/extension.js` — Extension Host
- `media/rich-editor-bundle.js` — Webview bundle

設定檔：[esbuild.config.js](../../esbuild.config.js)、[tsconfig.json](../../tsconfig.json)、[tsconfig.webview.json](../../tsconfig.webview.json)

---

## 打包與安裝

```bash
# 打包成 vsix
npm exec vsce -- package --no-dependencies
# 產出 html-visual-editor-0.1.0.vsix

# 安裝（方式 A：直接複製，推薦）
cp -r d:/html-visual-editor ~/.kiro/extensions/ezlifetech.html-visual-editor-0.1.0

# 安裝（方式 B）：Kiro → Ctrl+Shift+X → ... → From VSIX
```

安裝後重啟 Kiro，開啟 `.html` 檔右鍵選「HTML Visual Editor」。

---

## 調試流程

1. 終端機執行 `npm run watch`，看到 `Watching...` 即可。
2. VS Code 按 **F5** 開啟「Extension Development Host」。
3. 在新視窗開啟 `test.html`，選擇「HTML Visual Editor」。
4. 改完代碼，在調試視窗按 **F5** 或 `Ctrl+R` 重新載入。

### 日誌位置
| 用途 | 位置 |
|------|------|
| Extension Host 日誌（`[HTML-Editor]`） | `Ctrl+Shift+U` → Output 下拉選「Extension Host」 |
| Webview 日誌（前端 JS） | 命令面板 → `Developer: Open Webview Developer Tools` → Console |

> Webview 的 `console.log` **不會**出現在 Output 面板，必須開 Webview DevTools。

---

## Webview 通訊協定（postMessage）

```
Webview 載入 → 送出 { type: 'ready' }
            → Extension 讀檔，回送 { type: 'init', payload: { html } }
            → bundle 載入內容到 sourceArea + Quill
使用者編輯 → 雙向同步（sourceArea ↔ Quill ↔ preview）
Ctrl+S    → 送出 { type: 'save', payload: { html } }
            → Extension 寫入 .html，並同步輸出 .md
            → 回送 { type: 'saved' } 顯示狀態
```

| 訊息 type | 方向 | payload |
|-----------|------|---------|
| `ready` | Webview → Host | — |
| `init` | Host → Webview | `{ html, isMarkdown, exportFilename, uiState }` |
| `save` | Webview → Host | `{ html }` |
| `saved` | Host → Webview | — |
| `uiState` | Webview → Host | `{ sourceCollapsed, toolsCollapsed, fmtCollapsed }`（收合狀態，存入 `globalState`） |

> 新增訊息類型時，必須同時更新本表與 [HtmlEditorProvider.ts](../../src/extension/HtmlEditorProvider.ts) 及 Webview 端處理邏輯。

---

## Webview 三大鐵則（務必遵守）

1. **CSP 必須含 `${webview.cspSource}`** — `script-src` / `style-src` 缺它則 bundle 載入失敗、畫面空白。
2. **`acquireVsCodeApi()` 只能呼叫一次** — 不要在 HTML 另加 inline script 搶用 API。
3. **HTML 必須提供 bundle 需要的所有元素 ID** — `sourceArea`、`editor`、`preview`、`toolsBar`、
   `toolsToggle`、`fmtToggle` 及各工具列/搜尋按鈕。

---

## 已知限制

1. 預覽 iframe 受 sandbox 限制（安全考量）。
2. 無 HTML 語法檢查 / 驗證。
3. 配色固定，無主題切換。

## 未來方向

- HTML 語法檢查、元素檢查器（點擊預覽選元素）
- CSS / JS 檔案支援、Emmet、代碼格式化
- 響應式預覽（多解析度）
