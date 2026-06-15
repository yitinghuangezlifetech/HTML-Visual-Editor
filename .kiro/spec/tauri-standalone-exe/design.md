# 技術設計：Tauri 獨立執行檔（Windows .exe）

## 整體架構

```
┌─────────────────────────────────────────────────────┐
│                   Tauri App                         │
│                                                     │
│  ┌──────────────┐      IPC (invoke)                 │
│  │  Rust Core   │◄──────────────────────────────┐  │
│  │  (main.rs)   │                               │  │
│  │              │  read_file / write_file /      │  │
│  │  - fs 讀寫   │  read_dir commands             │  │
│  │  - .md 輸出  │                               │  │
│  └──────────────┘                               │  │
│                                                 │  │
│  ┌──────────────────────────────────────────────┘  │
│  │              WebView2（前端）                    │
│  │                                                  │
│  │  ┌──────────┐  ┌───────────────┐  ┌──────────┐  │
│  │  │ 檔案清單  │  │  原始碼編輯   │  │ Quill /  │  │
│  │  │ (sidebar)│  │  (textarea)   │  │ Preview  │  │
│  │  └──────────┘  └───────────────┘  └──────────┘  │
│  └──────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────┘
```

---

## 專案結構（新建 Tauri 專案）

```
tauri-html-editor/
├── src-tauri/
│   ├── src/
│   │   └── main.rs          # Rust commands：read_file, write_file, read_dir
│   ├── Cargo.toml
│   └── tauri.conf.json      # App 設定、視窗大小、bundle 設定
├── src/
│   ├── index.html           # 三欄佈局（sidebar + source + editor/preview）
│   ├── main.ts              # 前端進入點（沿用 rich-editor.ts 邏輯）
│   ├── sidebar.ts           # Workspace 檔案清單元件
│   └── style.css
├── package.json
└── vite.config.ts           # Vite + Tauri plugin
```

---

## Rust Core 變更（src-tauri/src/main.rs）

### Tauri Commands

```rust
// 讀取單一 HTML 檔案內容
#[tauri::command]
fn read_file(path: String) -> Result<String, String>

// 寫入 HTML 檔案，並同步輸出 .md
#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String>

// 讀取資料夾內所有 .html 檔案清單
#[tauri::command]
fn read_dir(dir_path: String) -> Result<Vec<String>, String>
```

### .md 輸出邏輯
- `write_file` 呼叫時，同步將 HTML 轉為 Markdown 並寫入同目錄 `.md`
- 使用 `htmd` 或 `markdown` crate（對應現有 `turndown` 功能）

---

## 前端變更

### 佈局：三欄結構

```
┌─────────┬──────────────────┬──────────────────┐
│ Sidebar │   Source Editor  │  Quill / Preview │
│ 200px   │   flex: 1        │   flex: 1        │
│         │                  │                  │
│ 檔案清單 │  <textarea>      │  Quill / iframe  │
│ .html × │  #sourceArea     │  #editor         │
│ .html ● │                  │  #preview        │
└─────────┴──────────────────┴──────────────────┘
```

### sidebar.ts（新增）

| 功能 | 說明 |
|------|------|
| 顯示檔案清單 | 呼叫 `read_dir` 取得 `.html` 清單並渲染 |
| 切換檔案 | 點擊後呼叫 `read_file`，載入內容至 sourceArea + Quill |
| 未儲存標示 | 各檔案維護 `dirty` 狀態，未儲存顯示 `●` |
| 開啟資料夾 | 呼叫 Tauri `dialog::open` 選取資料夾 |

### main.ts（沿用 rich-editor.ts，調整點）

| 原本（VS Code Webview） | 改為（Tauri）|
|------------------------|-------------|
| `acquireVsCodeApi().postMessage(save)` | `invoke('write_file', { path, content })` |
| `window.addEventListener('message', init)` | `invoke('read_file', { path })` |
| vscode API 初始化 | Tauri `@tauri-apps/api` 初始化 |

---

## 通訊協定（前端 ↔ Rust）

| 動作 | 前端呼叫 | Rust Command | 回傳 |
|------|---------|--------------|------|
| 開啟資料夾 | `dialog.open({ directory: true })` | — | `string`（路徑）|
| 讀取檔案清單 | `invoke('read_dir', { dir_path })` | `read_dir` | `string[]` |
| 載入檔案 | `invoke('read_file', { path })` | `read_file` | `string`（HTML 內容）|
| 儲存檔案 | `invoke('write_file', { path, content })` | `write_file` | `void` |

---

## 打包設定（tauri.conf.json）

```json
{
  "bundle": {
    "targets": ["nsis", "app"],
    "windows": {
      "wix": null
    }
  },
  "app": {
    "windows": [
      {
        "title": "HTML Visual Editor",
        "width": 1400,
        "height": 900,
        "resizable": true
      }
    ]
  }
}
```

產出：`html-visual-editor_x.x.x_x64.exe`（portable）

---

## 影響範圍

| 檔案 | 狀態 | 說明 |
|------|------|------|
| `src/webview/rich-editor.ts` | 參考沿用 | 核心邏輯移植到新專案 `src/main.ts` |
| `src/extension/HtmlEditorProvider.ts` | 不使用 | 由 Rust commands 取代 |
| `src/extension/extension.ts` | 不使用 | Tauri entry point 取代 |
| `media/rich-editor-bundle.js` | 參考沿用 | Vite 重新打包 |

> 本方案為**獨立新專案**，不修改現有 VS Code 外掛程式碼。

---

## 已知風險

| 風險 | 緩解方式 |
|------|---------|
| WebView2 未安裝（極舊 Win10） | 打包時加入 WebView2 Bootstrapper（Tauri 支援） |
| HTML → Markdown 轉換品質 | 先用 `htmd` crate，若不足再評估前端轉（引入 turndown.js） |
| Quill 初始化時序問題 | 沿用現有 `ready` 事件機制，改為 DOM ready 後呼叫 `read_file` |
