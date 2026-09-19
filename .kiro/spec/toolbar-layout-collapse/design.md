# 技術設計：工具列版面調整與收合（toolbar-layout-collapse）

> 對應需求：[requirements.md](./requirements.md)

---

## 1. 版面變更總覽

### 現況
```
┌ topbar ────────────────────────────────────────────────────┐
│ ✏ HTML Visual Editor  [💾 Save] [轉存html] [◀ 收闔原始碼]  狀態 │
├──────────────────────┬─────────────────────────────────────┤
│ SOURCE CODE 🔍 A− A+ │ RICH TEXT EDITOR  🔍 │ 🖊Rich 👁Preview│
│ ◀30 ⬛50 70▶         ├─────────────────────────────────────┤
│                      │ 表格: ⊞插入 │ ↑列 ↓列 ←欄 欄→ │ 刪… │
│  <textarea>          ├─────────────────────────────────────┤
│                      │ 區塊: ⬛插入區塊 │ 底色 清除底色     │
│                      ├─────────────────────────────────────┤
│                      │ Quill toolbar（.ql-toolbar，兩列）   │
│                      ├─────────────────────────────────────┤
│                      │ #editor                             │
└──────────────────────┴─────────────────────────────────────┘
```

### 目標
```
┌ topbar ────────────────────────────────────────────────────┐
│ ✏ HTML Visual Editor                                   狀態 │
├──────────────────────┬─────────────────────────────────────┤
│ SOURCE CODE 🔍 A− A+ │ RICH…🔍│🖊Rich 👁Preview│💾Save 轉存html ◀收闔原始碼│
│ ◀30 ⬛50 70▶         ├─────────────────────────────────────┤
│                      │ ▾ ┊ 表格: ⊞插入 …刪表格 ┊ 區塊: ⬛插入區塊 底色… │
│  <textarea>          ├─────────────────────────────────────┤
│                      │ ▾文字 │ Quill toolbar（Normal ▾ …）   │
│                      ├─────────────────────────────────────┤
│                      │ #editor（收合後向上擴張）             │
└──────────────────────┴─────────────────────────────────────┘
```

---

## 2. Extension Host 變更

檔案：[src/extension/extension.ts](../../../src/extension/extension.ts)（`getWebviewContent` 內的 HTML/CSS 字串 + `onDidReceiveMessage`）

### 2.1 HTML 結構

**topbar（原 L437-443）** — 移除三顆按鈕，只留標題與狀態：
```html
<div class="topbar">
  <span class="topbar-title">✏ HTML Visual Editor</span>
  <div class="status" id="status"></div>
</div>
```

**右側 panel-header（原 L481-487）** — 在 `btnPreview` 之後追加分隔線與三顆按鈕
（元素 ID 完全沿用，webview 端 `getElementById` 不需改動）：
```html
<div class="panel-header">
  <span class="label" id="rightLabel">Rich Text Editor</span>
  <button class="zoom-btn" id="searchRightBtn" title="搜尋 (Ctrl+F)">🔍</button>
  <div class="win-sep"></div>
  <button class="win-btn active" id="btnRich"    title="Rich Text 編輯模式">🖊 Rich</button>
  <button class="win-btn"        id="btnPreview" title="預覽模式">👁 Preview</button>
  <div class="win-sep"></div>
  <button class="hdr-btn save"   id="saveBtn"          title="Save (Ctrl+S)">💾 Save</button>
  <button class="hdr-btn export" id="exportHtmlBtn"    title="存為 HTML" style="display:none;">轉存html</button>
  <button class="hdr-btn"        id="toggleSourceBtn"  title="收闔/展開原始碼">◀ 收闔原始碼</button>
</div>
```

**合併工具列（取代原 L495-523 的 `#tableBar` + `#blockBar`）**：
```html
<div class="table-bar" id="toolsBar">
  <button class="t-btn toggle" id="toolsToggle" title="收合/展開 表格與區塊工具">▾</button>
  <span class="tools-group" id="toolsGroups">
    <span class="table-bar-label">表格:</span>
    <button class="t-btn" id="tblInsert">⊞ 插入</button>
    <div class="win-sep"></div>
    <button class="t-btn" id="tblRowAbove">↑列</button>
    … （tblRowBelow / tblColLeft / tblColRight / tblDelRow / tblDelCol / tblDelTable 原樣保留）
    <div class="win-sep"></div>
    <span class="table-bar-label">區塊:</span>
    <button class="t-btn" id="blkInsert">⬛ 插入區塊</button>
    <label class="t-btn">底色 <input type="color" id="blkBgColor"></label>
    <button class="t-btn" id="blkBgClear">清除底色</button>
  </span>
  <div class="table-popover" id="tablePopover"> …原內容不變… </div>
</div>
```
**文字工具列收合鈕（`#editorWrap` 內，Quill 工具列同列最左）**：
```html
<div id="editorWrap">
  <div class="fmt-row" id="fmtRow">
    <button class="t-btn toggle fmt" id="fmtToggle" title="收合/展開 文字工具列">▾ 文字</button>
  </div>
  <div id="editor"></div>
</div>
```
> Quill 會把 `.ql-toolbar` 插在 `#editor` 之前；webview 端於初始化後將其 `appendChild` 進 `#fmtRow`，
> 使按鈕位於 `Normal` 下拉左側。按鈕**刻意不放進 `.ql-toolbar` 內** —— 否則收合時按鈕隨工具列一起隱藏，
> 使用者將無法展開。

> `#tableBar`、`#blockBar` 兩個 id 消失，改為 `#toolsBar`；webview 端對應 DOM ref 一併調整（見 3.1）。
> 16 個功能性 ID 全數保留（需求 B4）。

### 2.2 CSS

| 選擇器 | 變更 |
|--------|------|
| `.topbar button#saveBtn…` | 改為不綁 `.topbar`：`#saveBtn`／`#exportHtmlBtn`／`#toggleSourceBtn` 由 `.hdr-btn` 系列取代 |
| `.hdr-btn`（新增） | `padding:1px 8px; border:1px solid #555; border-radius:3px; background:transparent; color:#ccc; font-size:11px; cursor:pointer;` |
| `.hdr-btn.save`（新增） | `background:#2d7d46; color:#fff; border-color:#2d7d46;`（hover `#3a9c5a`） |
| `.hdr-btn.export`（新增） | `background:#0e639c; color:#fff; border-color:#0e639c;`（hover `#1177bb`） |
| `.panel-header`（修改） | 加 `flex-wrap: wrap; row-gap: 4px;`，窄面板時按鈕換行不破版 |
| `.table-bar`（修改） | 加 `flex-wrap: wrap; row-gap: 3px;`（需求 B6） |
| `.tools-group`（新增） | `display:inline-flex; align-items:center; gap:3px; flex-wrap:wrap; flex:1;` |
| `#toolsBar.collapsed .tools-group`（新增） | `display:none;` |
| `.t-btn.toggle`（新增） | `color:#858585; min-width:22px;`；`#toolsToggle` 於工具列行首最左 |
| `.fmt-row`（新增） | `display:flex; align-items:flex-start;` 承載 `#fmtToggle` 與 Quill 工具列 |
| `.fmt-row > .ql-toolbar.ql-snow`（新增） | `flex:1; border-bottom:none;` |
| `#fmtToggle`（新增） | `margin:6px 0 6px 8px; flex-shrink:0;` |
| `.ql-toolbar.ql-snow.collapsed`（新增） | `display:none !important;` |
| `.table-popover`（修改） | `top: calc(100% + 4px); left: 10px;`（改為相對整行底部，避免合併後錯位；需求 B5） |

### 2.3 訊息處理（`onDidReceiveMessage`）

新增分支：
```ts
} else if (message.type === 'uiState') {
  await _extensionContext.globalState.update('htmlVisualEditor.uiState', message.payload);
}
```

`ready` 分支的 `init` payload 追加 `uiState` 欄位：
```ts
payload: {
  html, isMarkdown, exportFilename,
  uiState: _extensionContext.globalState.get('htmlVisualEditor.uiState', {
    sourceCollapsed: false, toolsCollapsed: false, fmtCollapsed: false,
  }),
}
```
> 採 Extension Host `globalState` 而非 webview `setState`：`setState` 只在 webview 實例存活期間有效，
> 關檔再開即遺失，無法滿足需求 D1（持久化）。`globalState` 為全域偏好，所有檔案共用同一組收合偏好。

---

## 3. Webview 變更

檔案：[src/webview/rich-editor.ts](../../../src/webview/rich-editor.ts)

### 3.1 DOM refs（L81 / L96）
```ts
// 移除：const tableBar = …('tableBar')!; const blockBar = …('blockBar')!;
const toolsBar    = document.getElementById('toolsBar')!;
const toolsToggle = document.getElementById('toolsToggle')!;
const fmtToggle   = document.getElementById('fmtToggle')!;
```

### 3.2 Rich / Preview 切換（L462-477）
```ts
// 原：tableBar.style.display = 'flex'; blockBar.style.display = 'flex';
toolsBar.style.display = 'flex';   // Rich
toolsBar.style.display = 'none';   // Preview
```
> Quill toolbar 位於 `#editorWrap` 內，Preview 模式下隨 `editorWrap` 隱藏，無須另外處理。

### 3.3 收合狀態管理（新增區塊，置於「Toggle source panel collapse」附近）
```ts
type UiState = { sourceCollapsed: boolean; toolsCollapsed: boolean; fmtCollapsed: boolean };
const ui: UiState = { sourceCollapsed: false, toolsCollapsed: false, fmtCollapsed: false };

function qlToolbar(): HTMLElement | null {
  return document.querySelector('.ql-toolbar.ql-snow');
}

function applyUiState() {
  // 原始碼面板
  panelLeft.classList.toggle('collapsed', ui.sourceCollapsed);
  if (!ui.sourceCollapsed) panelLeft.style.flex = `0 0 ${lastSourceWidth}`;
  if (toggleSourceBtn) toggleSourceBtn.textContent = ui.sourceCollapsed ? '▶ 展開原始碼' : '◀ 收闔原始碼';
  // 表格＋區塊列
  toolsBar.classList.toggle('collapsed', ui.toolsCollapsed);
  toolsToggle.textContent = ui.toolsCollapsed ? '▸' : '▾';
  // Quill 文字工具列
  qlToolbar()?.classList.toggle('collapsed', ui.fmtCollapsed);
  fmtToggle.textContent = ui.fmtCollapsed ? '▸ 文字' : '▾ 文字';
}

function persistUiState() { vscode.postMessage({ type: 'uiState', payload: ui }); }
```
- `toolsToggle` / `fmtToggle` click → 翻轉對應旗標 → `applyUiState()` → `persistUiState()`。
- 既有 `toggleSourceBtn` handler（L514-528）改為：記錄 `lastSourceWidth` → 翻轉 `ui.sourceCollapsed`
  → `applyUiState()` → `persistUiState()`；原本的區域變數 `sourceCollapsed` 由 `ui.sourceCollapsed` 取代。
- 收合／展開只改 CSS class，**不重建 Quill 實例**（需求 C3）。

### 3.4 `init` 訊息處理
收到 `init` 時，若 `payload.uiState` 存在則 `Object.assign(ui, payload.uiState)` 並呼叫 `applyUiState()`。
`applyUiState()` 必須在 Quill 初始化之後才會找得到 `.ql-toolbar`——`init` 於 `ready` 之後回傳，
而 Quill 於模組載入時同步建立，順序安全。

---

## 4. 通訊協定

| 訊息 type | 方向 | payload | 說明 |
|-----------|------|---------|------|
| `uiState` | Webview → Host | `{ sourceCollapsed, toolsCollapsed, fmtCollapsed }` | **新增**：收合狀態變更時寫入 globalState |
| `init` | Host → Webview | `{ html, isMarkdown, exportFilename, uiState }` | **修改**：payload 追加 `uiState` |

> 須同步更新 `.kiro/steering/tech.md` 的協定表。

---

## 5. 影響範圍

| 檔案 | 變更 |
|------|------|
| `src/extension/extension.ts` | webview HTML（topbar、panel-header、合併工具列）、CSS、`uiState` 訊息、`init` payload |
| `src/webview/rich-editor.ts` | DOM refs、Rich/Preview 切換、收合狀態管理、`init` 處理、`toggleSourceBtn` handler |
| `.kiro/steering/tech.md` | 通訊協定表新增 `uiState`、`init` payload 更新 |
| `.kiro/steering/dash.md` | Spec 文件狀態表與時間線 |
| `.kiro/spec/03-features.md` | 功能說明（按鈕位置、收合行為） |

> `src/extension/HtmlEditorProvider.ts` 亦含一份較舊的 webview HTML（內有 `toggleSourceBtn`），
> 但 `package.json` 的進入點實際走 `extension.ts`；**本次不動** `HtmlEditorProvider.ts`，
> 避免擴大變更範圍（`.kiro/steering/basic.md` 設計哲學 1）。

## 6. 風險與對策

| 風險 | 對策 |
|------|------|
| 移除 `#tableBar`/`#blockBar` 導致 bundle 取不到元素而整頁失效（非空斷言 `!` 會丟例外） | 同一次修改中同步更新 HTML 與 `rich-editor.ts`，`npm run build` 後以 F5 實測確認 Rich/Preview 切換正常 |
| popover 合併後定位錯位 | 改用 `top: calc(100% + 4px)`，以 `#toolsBar` 為定位父層（已有 `position: relative`） |
| panel-header 按鈕過多，窄面板破版 | `flex-wrap: wrap` + `row-gap`，並以 30/50/70 三種寬度實測 |
| globalState 為全域偏好，不同檔案共用 | 符合需求（使用者要的是「記住我的習慣」），文件中明示此行為 |
