# structure.md — 專案目錄結構

> 本檔案為專案的 **source of truth** 之一。

---

## 兩層架構

本專案分為兩個明確分離的執行環境，職責不可混淆：

1. **Extension Host**（`src/extension/`）— 運行於 VS Code/Kiro Node.js 程序，負責註冊自訂編輯器、讀寫檔案、Markdown 同步。
2. **Webview**（`src/webview/`）— 運行於沙箱化的瀏覽器環境，負責 UI、編輯互動、即時預覽。

兩層之間僅透過 `postMessage` 通訊（協定見 `.kiro/steering/tech.md`）。

---

## 目錄結構

```
d:/html-visual-editor/
├── src/
│   ├── extension/                    # Extension Host（Node.js 端）
│   │   ├── extension.ts              # 進入點：activate、註冊編輯器與指令
│   │   ├── extension-simple.ts       # 精簡版進入點（實驗/備援）
│   │   ├── HtmlEditorProvider.ts     # CustomEditorProvider：讀檔、存檔、md 同步、Webview HTML
│   │   └── utils/
│   │       ├── htmlToMarkdown.ts     # HTML → Markdown
│   │       ├── markdownToHtml.ts     # Markdown → HTML
│   │       └── resourceResolver.ts   # Webview 資源 URI 解析
│   └── webview/                      # Webview（瀏覽器沙箱端，編譯成 bundle）
│       ├── main.ts                   # Webview 進入點
│       ├── simple-main.ts            # 精簡版進入點
│       ├── rich-editor.ts            # 右側 Quill 富文字編輯器邏輯
│       ├── wysiwyg-simple.ts         # 精簡 WYSIWYG 實作
│       ├── vscode-api.ts             # acquireVsCodeApi 封裝（只呼叫一次）
│       ├── editor/
│       │   ├── Canvas.ts             # 畫布
│       │   ├── SelectionManager.ts   # 元素選取
│       │   ├── DragDropManager.ts    # 拖放
│       │   └── HistoryManager.ts     # Undo/Redo 歷史
│       └── panels/
│           ├── ComponentLibrary.ts   # 元件庫面板
│           ├── DomInspector.ts       # DOM 樹檢查器
│           └── StylePanel.ts         # CSS 樣式面板
├── media/
│   └── rich-editor-bundle.js         # Webview 打包輸出（esbuild）
├── dist/
│   └── extension.js                  # Extension Host 編譯輸出（esbuild）
├── extension/
│   └── HTML_Visual_Editor_Guide.html # 使用說明（HTML）
├── .kiro/
│   ├── steering/                     # ← source of truth（basic/tech/structure/product/dash）
│   └── spec/                         # 既有規格文件（overview/development/features/...）
├── specs/                            # ← Spec-First 新功能流程的產出（requirements/design/tasks）
├── package.json
├── esbuild.config.js
├── tsconfig.json                     # Extension Host 編譯設定
├── tsconfig.webview.json             # Webview 編譯設定
└── test.html                         # 手動測試檔
```

---

## 命名與放置慣例

| 類型 | 放置位置 |
|------|----------|
| Extension Host 邏輯（檔案 I/O、VS Code API） | `src/extension/` |
| Webview UI / 互動邏輯 | `src/webview/` |
| 可共用的轉換/解析工具 | `src/extension/utils/`（Host）或 webview 對應位置 |
| 大型 UI 區塊（面板、檢查器） | `src/webview/panels/` |
| 編輯器核心行為（選取、拖放、歷史） | `src/webview/editor/` |
| 新功能規格 | `specs/{feature}/` |
| 專案規範 | `.kiro/steering/` |

---

## 關鍵約束

- **Webview 端禁止直接存取 Node.js / VS Code API**，一律透過 `vscode-api.ts` 封裝的 `postMessage`。
- **元素 ID 是契約**：`rich-editor.ts` 依賴 `sourceArea`、`editor`、`preview` 等 ID，修改 Webview HTML 前必先確認 bundle 需要哪些 ID（見 `.kiro/steering/basic.md` Section 3）。
- **編譯產物（`dist/`、`media/rich-editor-bundle.js`）不手動編輯**，一律由 esbuild 產生。
- 進入點存在 `*-simple.ts` 與正式版兩套；變更時確認 `package.json` 的 `main` 與 esbuild 設定實際指向哪個。
