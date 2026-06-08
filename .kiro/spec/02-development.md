# 開發指南

## 環境設置

```bash
cd d:/html-visual-editor
npm install
```

## 編譯

```bash
npm run build     # 單次編譯
npm run watch     # 監視模式（自動重新編譯）
```

esbuild 會輸出：
- `dist/extension.js`（Extension Host）
- `media/rich-editor-bundle.js`（Webview）

## 調試（推薦流程）

1. **啟動監視**（終端機）：`npm run watch`，看到 `Watching...` 即可
2. **啟動調試**：在 VS Code 按 **F5**（或 Run → Start Debugging），等 3–5 秒會開新的「Extension Development Host」視窗
3. **開啟測試檔**：在新視窗開啟 `test.html`，選擇「HTML Visual Editor」
4. **修改後重載**：改完代碼，在調試視窗按 **F5**（或 Ctrl+R）重新載入

## 查看日誌

| 用途 | 位置 |
|------|------|
| Extension Host 日誌（`[HTML-Editor]`） | `Ctrl+Shift+U` → Output 下拉選「Extension Host」 |
| Webview 日誌（前端 JS） | 命令面板 → `Developer: Open Webview Developer Tools` → Console |

> 注意：Webview 的 console.log **不會**出現在 Output 面板，必須開 Webview DevTools。
> Debug Console 裡 `is-electron`、`Bad credentials`、`Converting circular structure` 等錯誤是 Kiro 內建其他擴充功能產生的，與本專案無關。

## 打包

```bash
npm exec vsce -- package --no-dependencies
# 產出 html-visual-editor-0.1.0.vsix
```

## 安裝到 Kiro

```bash
# 方式 A：直接複製（推薦）
cp -r d:/html-visual-editor ~/.kiro/extensions/ezlifetech.html-visual-editor-0.1.0

# 方式 B：UI 安裝
# Kiro → Ctrl+Shift+X → ... → From VSIX → 選擇 .vsix
```

安裝後重啟 Kiro，開啟 `.html` 檔右鍵選「HTML Visual Editor」。

## 測試清單

- [ ] 開啟 test.html，左側顯示原始碼、右側顯示富文字編輯器
- [ ] 左側編輯 → 右側同步
- [ ] 切換 🖊 Rich / 👁 Preview
- [ ] Ctrl+S 存檔成功，同目錄產生 `.md`
- [ ] 關閉重開，修改仍在
