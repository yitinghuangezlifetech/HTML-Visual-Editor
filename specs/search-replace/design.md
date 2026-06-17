# 技術設計：搜尋與取代（Search & Replace）

## Extension Host 變更

無 Extension Host 層變更。所有邏輯在 Webview 端。

## Webview 變更

### 1. HTML 結構 (extension.ts)

在 `searchLeftBar` 中添加取代輸入欄與按鈕：

```html
<div class="search-bar" id="searchLeft">
  <input type="text" id="searchLeftInput" placeholder="搜尋原始碼...">
  <span class="match-count" id="searchLeftCount"></span>
  <button class="s-btn" id="searchLeftPrev" title="上一個">↑</button>
  <button class="s-btn" id="searchLeftNext" title="下一個">↓</button>
  <button class="s-btn close-btn" id="searchLeftClose" title="關閉">✕</button>
  <!-- 新增取代列 -->
  <div class="search-divider"></div>
  <input type="text" id="searchLeftReplace" placeholder="取代為...">
  <button class="s-btn" id="searchLeftReplaceOne" title="取代本筆">替</button>
  <button class="s-btn" id="searchLeftReplaceAll" title="取代全部">替All</button>
</div>
```

### 2. CSS 變更 (extension.ts)

- 擴展 `.search-bar` 為 flexbox column 容器
- 新增 `.search-row` 用於搜尋列 / 取代列分組
- 新增 `.search-divider` 分隔線
- 調整輸入欄寬度使並排顯示

### 3. TypeScript 邏輯 (rich-editor.ts)

#### DOM 參考

```typescript
const searchLeftReplace     = document.getElementById('searchLeftReplace') as HTMLInputElement;
const searchLeftReplaceOne  = document.getElementById('searchLeftReplaceOne')!;
const searchLeftReplaceAll  = document.getElementById('searchLeftReplaceAll')!;
```

#### 狀態

無新增全局狀態（複用既有 `leftMatches` 與 `leftIdx`）。

#### 函式實現

- **`replaceLeftOne()`**：
  - 取得當前游標位置（`leftIdx`）
  - 在 `sourceArea` 中找出對應的匹配項
  - 使用 `setSelectionRange` 選中該項
  - 用 `substring` + `setRangeText` / 直接替換達成取代
  - 更新 sourceArea 內容
  - 觸發 sync（同步至 Quill、preview、history）

- **`replaceLeftAll()`**：
  - 逐個取代所有 `leftMatches` 項目
  - 由於取代會改變位置，需從後向前遍歷
  - 計算替換數量，提示使用者

#### 事件綁定

```typescript
searchLeftReplaceOne.addEventListener('click', replaceLeftOne);
searchLeftReplaceAll.addEventListener('click', replaceLeftAll);
```

#### 同步機制

取代操作視為 sourceArea 編輯：
1. 修改 `sourceArea.value`
2. 觸發 `updatePreview()` 與 `syncToQuill()`（既有機制）
3. 推送到 HistoryManager

## 通訊協定

無新增 postMessage 訊息（完全在 Webview 端實現）。

## 影響範圍

修改檔案：
- `src/extension/extension.ts` — HTML 結構 + CSS
- `src/webview/rich-editor.ts` — 取代邏輯 + 事件綁定

## UI 佈局概覽

搜尋列（現有）→ 換行 → 取代列（新增）

```
┌─ searchLeft ────────────────────────────────┐
│  [搜尋輸入] [計數] [↑] [↓] [✕]             │  (搜尋列)
│  ─────────────────────────────────────────  │  (分隔線)
│  [取代輸入]        [替] [替All]            │  (取代列)
└──────────────────────────────────────────────┘
```

## 交互流程

1. 使用者在搜尋輸入欄輸入「查詢詞」
2. 系統反白所有匹配項，顯示「當前 / 總數」
3. 使用者在取代輸入欄輸入「取代詞」
4. 按「替」取代當前項 → sourceArea 同步 → 自動搜尋下一個
5. 或按「替All」一次取代全部 → 提示「已替換 N 個」
