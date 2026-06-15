# 技術設計：檔案附加功能

## 現況分析

- 正式進入點：`src/extension/extension.ts`（載入 `rich-editor-bundle.js`）
- Webview 端：`src/webview/rich-editor.ts`
- 通訊方式：`vscode.postMessage` ↔ `webviewPanel.webview.onDidReceiveMessage`
- 現有訊息類型：`ready`、`init`、`save`、`saved`、`saveFailed`、`openLink`
- `mammoth` 尚未安裝，需加入 `dependencies`

---

## Extension Host 變更（`src/extension/extension.ts`）

### 新增訊息處理：`attachFile`

Webview 送出：
```json
{ "type": "attachFile" }
```

Host 處理流程：
1. 呼叫 `vscode.window.showOpenDialog()` 開啟系統檔案選擇對話框（單選，無副檔名限制）
2. 取得目前文件路徑，計算附件目錄：`{htmlDir}/{htmlBasename}/`（如 `notes/notes/`）
3. 若目錄不存在，以 `fs.mkdirSync(..., { recursive: true })` 建立
4. 計算目標路徑，若已存在同名檔案，在檔名後加 `_2`、`_3`... 直到不衝突
5. 以 `fs.copyFileSync()` 複製檔案到目標路徑
6. 判斷副檔名：
   - **`.docx`**：用 `mammoth.convertToHtml({ path })` 轉換，取得 `result.value`（HTML 片段）
   - **其他**：產生相對連結 HTML 片段 `<a href="{folder}/{filename}">{filename}</a>`
7. 計算相對路徑（相對於 HTML 檔案位置）
8. 回傳結果給 Webview：
```json
{
  "type": "fileAttached",
  "payload": {
    "mode": "embed" | "link",
    "htmlFragment": "<a href=\"...\">...</a>",
    "filename": "example.docx",
    "relPath": "notes/example.docx"
  }
}
```
9. 若 HTML 檔案未儲存（`document.uri.scheme !== 'file'`），回傳錯誤：
```json
{ "type": "attachError", "error": "請先儲存 HTML 檔案後再附加" }
```
10. `.docx` 轉換失敗時，降級為 link 模式並繼續

### 新增 dependency

```bash
npm install mammoth
```

---

## Webview 變更（`src/webview/rich-editor.ts`）

### 新增 DOM ref

```ts
const attachBtn = document.getElementById('attachBtn') as HTMLButtonElement | null;
```

### 新增訊息監聽

在現有 `window.addEventListener('message', ...)` 的 switch 中加入：

```ts
case 'fileAttached':
  insertAttachment(msg.payload);
  break;
case 'attachError':
  setStatus('❌ ' + msg.error);
  break;
```

### 新增函式 `insertAttachment(payload)`

```ts
function insertAttachment(payload: { htmlFragment: string; filename: string }) {
  // 插入到 sourceArea 游標位置（或末尾）
  const pos = sourceArea.selectionStart ?? sourceArea.value.length;
  const before = sourceArea.value.slice(0, pos);
  const after  = sourceArea.value.slice(pos);
  sourceArea.value = before + '\n' + payload.htmlFragment + '\n' + after;

  // 同步 Quill
  loadHtml(sourceArea.value);
  schedulePreview();
  isDirty = true;
  setStatus(`📎 已附加 ${payload.filename}`);
}
```

### 按鈕事件

```ts
attachBtn?.addEventListener('click', () => {
  vscode.postMessage({ type: 'attachFile' });
  setStatus('⏳ 選擇檔案中...');
});
```

---

## HTML 結構變更（`extension.ts` getWebviewContent）

在工具列加入附加按鈕（緊接 `#toggleSourceBtn` 後）：

```html
<button id="attachBtn" title="附加檔案">📎 附加檔案</button>
```

---

## 通訊協定（新增訊息）

| 訊息 type | 方向 | payload |
|-----------|------|---------|
| `attachFile` | Webview → Host | — |
| `fileAttached` | Host → Webview | `{ mode, htmlFragment, filename, relPath }` |
| `attachError` | Host → Webview | `{ error: string }` |

---

## `.md` 同步

不需在 Webview 端另外處理。使用者按 `Ctrl+S` 儲存時，`extension.ts` 的 save handler 會呼叫 `htmlToMarkdown(html)` 重新產生完整 MD，已包含附件連結。

---

## 影響範圍

| 檔案 | 變更性質 |
|------|---------|
| `src/extension/extension.ts` | 加入 `attachFile` 訊息處理、`mammoth` import、工具列按鈕 HTML |
| `src/webview/rich-editor.ts` | 加入 `attachBtn` ref、`fileAttached`/`attachError` 訊息監聽、`insertAttachment()` 函式 |
| `package.json` | 加入 `mammoth` dependency |

---

## 不採用方案

- **Webview 直接讀檔**：Webview 沙箱無法存取本地檔案，必須透過 Extension Host。
- **base64 嵌入圖片**：需求只要求連結，不需嵌入二進位；docx 才嵌入內容。
- **多檔同時上傳**：需求明確排除，保持單次單檔。
