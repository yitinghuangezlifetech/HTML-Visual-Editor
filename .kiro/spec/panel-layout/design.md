# 技術設計：面板版面配置（預設 30/70 + 原始碼收闔）

## 現況分析

- `HtmlEditorProvider.ts` 的 `getWebviewContent()` 載入 `editor-bundle.js`（來自 `src/webview/main.ts`）
- 目前 Webview HTML 結構：左側 `.canvas-wrapper`（`flex: 1`）+ 右側 `.sidebar`（`width: 300px`）
- `rich-editor.ts` 已有 `panelLeft`、`resizer`、`split`、`winNarrow/winHalf/winWide` 等邏輯，但使用的是另一組 bundle（`rich-editor-bundle.js`），未被目前的 `HtmlEditorProvider` 載入

**結論**：本功能的改動範圍在 `HtmlEditorProvider.ts` 的 Webview HTML + CSS，以及 `main.ts` 的初始化邏輯。不涉及 Extension Host 的 postMessage 通訊。

---

## Extension Host 變更

- 無需新增訊息類型
- `HtmlEditorProvider.ts`：修改 `getWebviewContent()` 方法中的 HTML/CSS，調整面板結構與初始寬度

---

## Webview 變更

### HTML 結構調整

```
#app
├── .toolbar
│   ├── ... (既有按鈕)
│   └── #toggleSourceBtn  ← 新增：收闔/展開原始碼按鈕
├── #split  ← 新增：包裹左右面板的 flex 容器
│   ├── #panelLeft  ← 新增：左側原始碼面板，初始 flex: 0 0 30%
│   │   ├── .canvas-label ("原始碼")
│   │   └── #sourceArea (textarea)  ← 原本在 main.ts 中尋找的 canvas 換為 sourceArea
│   ├── #resizer  ← 新增：拖曳分隔條
│   └── .canvas-wrapper  ← 右側，flex: 1
│       ├── .canvas-label ("Canvas Preview")
│       └── iframe#canvas
```

> 注意：`main.ts` 目前查找 `#canvas`，改版後仍保留該 ID，不影響 Canvas 初始化。

### 新增元素 ID

| ID | 用途 |
|----|------|
| `split` | 左右面板的 flex 容器，供 drag-resize 計算寬度 |
| `panelLeft` | 左側原始碼面板，透過 `flex: 0 0 30%` 控制寬度 |
| `resizer` | 分隔條，mousedown 啟動拖曳 |
| `toggleSourceBtn` | 工具列的收闔/展開按鈕 |
| `sourceArea` | 原始碼 textarea（若 main.ts 需要存取）|

### CSS 變更（內嵌於 HtmlEditorProvider.ts）

```css
#split {
  flex: 1;
  display: flex;
  overflow: hidden;
}
#panelLeft {
  flex: 0 0 30%;        /* 預設 30% */
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: flex-basis 0.15s ease;
}
#panelLeft.collapsed {
  flex: 0 0 0%;
  overflow: hidden;
}
#resizer {
  width: 4px;
  background: #3e3e42;
  cursor: col-resize;
  flex-shrink: 0;
}
#resizer:hover, #resizer.dragging {
  background: #007acc;
}
```

### JS 行為（內嵌 inline script，nonce 保護）

1. **初始化**：頁面載入後，`#panelLeft` 預設 `flex: 0 0 30%`（已由 CSS 設定）。
2. **收闔/展開**：
   - 維護 `lastWidth`（預設 `'30%'`）
   - 點擊 `#toggleSourceBtn`：
     - 若未收闔：記錄 `lastWidth = panelLeft.style.flexBasis || '30%'`，設 `panelLeft.style.flex = '0 0 0%'`，按鈕顯示「▶ 展開原始碼」，隱藏 `#resizer`
     - 若已收闔：還原 `panelLeft.style.flex = '0 0 ' + lastWidth`，按鈕顯示「◀ 收闔原始碼」，顯示 `#resizer`
3. **拖曳調整寬度**（drag-to-resize）：
   - `#resizer` mousedown → 拖曳計算百分比（10%～90%）→ 更新 `panelLeft.style.flex`
   - 與 `rich-editor.ts` 現有邏輯相同，複製至此 inline script

> ⚠️ 遵守 Webview 鐵則：`acquireVsCodeApi()` 只在 bundle 中呼叫一次；inline script 不呼叫。

---

## 通訊協定

無新增 postMessage 訊息類型。

---

## 影響範圍

| 檔案 | 變更性質 |
|------|---------|
| `src/extension/HtmlEditorProvider.ts` | 修改 `getWebviewContent()`：HTML 結構、CSS、inline JS |
| `src/webview/main.ts` | 不需修改（`#canvas` ID 保留） |

---

## 不採用方案

- **修改 rich-editor.ts / 切換至 rich-editor-bundle**：範圍太大，會影響 Quill 整合，超出本功能需求。
- **透過 postMessage 傳遞寬度**：純 UI 狀態，不需 Extension Host 介入。
