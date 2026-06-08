# 專案概述

## 簡介

**HTML Visual Editor** 是為 Kiro（VS Code 衍生版）開發的 VS Code 擴充功能，提供 HTML 的即時視覺編輯與預覽，採左右分割視圖。

## 目標

- VS Code Extension 相容的自訂編輯器（`.html` 檔案）
- 左右分割：原始碼編輯 + 富文字編輯／即時預覽
- 儲存時同步輸出 Markdown（`.md`）
- 直觀的使用者介面

## 技術架構

| 組件 | 技術 | 說明 |
|------|------|------|
| Extension Host | TypeScript + Node.js | 運行於 Kiro 程序，註冊自訂編輯器 |
| Webview | HTML5 + CSS3 | 使用者介面層 |
| 原始碼編輯 | textarea (`#sourceArea`) | 左側 HTML 代碼編輯 |
| 富文字編輯 | Quill (`#editor`) | 右側 WYSIWYG，可切換預覽 |
| 即時預覽 | iframe (`#preview`) | srcdoc 渲染 |

### 開發工具
- **語言**：TypeScript
- **編譯**：esbuild
- **打包**：vsce
- **核心 API**：`CustomEditorProvider`、Webview `postMessage`

## 檔案結構

```
d:/html-visual-editor/
├── src/
│   ├── extension/
│   │   ├── extension.ts          # 主程序：註冊編輯器、Webview HTML、存檔、md 同步
│   │   └── utils/
│   │       ├── htmlToMarkdown.ts  # HTML → Markdown
│   │       └── markdownToHtml.ts  # Markdown → HTML
│   └── webview/
│       └── rich-editor.ts         # 右側 Quill 編輯器邏輯（編譯成 bundle）
├── media/
│   └── rich-editor-bundle.js     # Webview 打包輸出
├── dist/
│   └── extension.js              # Extension Host 編譯輸出
├── spec/                         # 規格文件（本資料夾）
├── package.json
├── esbuild.config.js
└── test.html                     # 測試檔案
```

## Webview 通訊流程

```
Webview 載入 → bundle 送出 { type: 'ready' }
            → 擴充功能讀檔，回送 { type: 'init', payload: { html } }
            → bundle 載入內容到 sourceArea + Quill
使用者編輯 → 雙向同步（sourceArea ↔ Quill ↔ preview）
Ctrl+S    → bundle 送出 { type: 'save', payload: { html } }
            → 擴充功能寫入 .html，並同步輸出 .md
            → 回送 { type: 'saved' } 顯示狀態
```

## 已知限制

1. 預覽 iframe 受 sandbox 限制（安全考量）
2. 無 HTML 語法檢查／驗證
3. 配色固定，無主題切換

## 未來方向

- HTML 語法檢查
- 元素檢查器（點擊預覽選元素）
- CSS／JS 檔案支援、Emmet、代碼格式化
- 響應式預覽（多解析度）
