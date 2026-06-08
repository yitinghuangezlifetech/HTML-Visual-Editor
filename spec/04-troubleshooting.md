# 故障排查

## 看日誌前先分辨來源

- **本專案日誌**：`[HTML-Editor]`（Extension Host）、Webview DevTools Console（前端）
- **無關雜訊**：`is-electron`、`Bad credentials - docs.github.com`、`Converting circular structure to JSON`、`yaml.schemas`、`One Dark Modern` 等，皆為 Kiro 其他擴充功能（Continue、GitHub PR、kiroAgent）產生，可忽略。

## 常見問題

### 1. Webview 完全空白／元素不顯示

| 可能原因 | 解法 |
|----------|------|
| CSP 未含 `webview.cspSource` | `script-src`／`style-src` 必須包含 `${webview.cspSource}`，否則 bundle 載入不了 |
| 元素 ID 與 bundle 不符 | `rich-editor.ts` 需要 `sourceArea`、`editor`、`preview`、各按鈕等 ID，HTML 必須完整提供 |
| 重複呼叫 `acquireVsCodeApi()` | 此 API 一個 webview 只能呼叫一次；inline script 若先呼叫會讓 bundle 失效。不要在 HTML 加自己的 inline script |

### 2. iframe 預覽空白

| 可能原因 | 解法 |
|----------|------|
| flex 佈局讓 iframe 高度塌陷 | 用絕對定位填滿，或確保父容器有明確高度 |
| `srcdoc` 在巢狀 webview 不渲染 | 改用 `contentDocument.open()/write()/close()` |
| CSP 擋住 frame | 視需求加 `frame-src` |

### 3. 代碼編輯後預覽不同步

- 確認 `sourceArea` 的 `input` 事件有觸發 `schedulePreview()`
- 確認 iframe 已 load 完成才操作其 document

### 4. 儲存失敗

- 確認使用 `CustomEditorProvider`（可編輯），非 `CustomReadonlyEditorProvider`
- 檢查檔案權限與路徑

### 5. 擴充功能未載入／未更新

- 確認 Kiro 已完全重啟
- 確認 `dist/extension.js` 存在且為最新（重新 `npm run build`）
- 必要時清除舊的 `~/.kiro/extensions/...` 再重新複製

## 快速驗證 iframe 尺寸

在 Webview DevTools Console（切換到本擴充功能的 frame）輸入：

```js
document.getElementById('preview').getBoundingClientRect()
```

`width`／`height` 為 0 代表佈局問題。
